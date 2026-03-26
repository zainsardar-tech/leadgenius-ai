import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
};

type GroundingLink = {
  title: string;
  uri: string;
  type: "web" | "maps";
};

export type BusinessProfile = {
  companyName: string;
  industry: string;
  targetedIndustries: string;
  services: string;
  usp: string;
  targetMarket: string;
  budgetLevel: string;
  salesGoal: string;
  salesGoalCurrency: string;
  outreachChannel: string;
  geographicTarget: string;
  competitors: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { status?: number; message?: string };
  const status = maybeError.status;
  const message = maybeError.message?.toLowerCase() ?? "";

  return (
    status === 429 ||
    status === 408 ||
    (typeof status === "number" && status >= 500) ||
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("timeout")
  );
};

async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetriableError(error)) {
        throw error;
      }
      const backoff = baseDelayMs * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 150);
      await sleep(backoff + jitter);
    }
  }

  throw lastError;
}

export const getServerGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateJsonMagicProfile(description: string) {
  const ai = getServerGenAI();

  const prompt = `
You are an AI assistant helping to fill out a business profile form.
Based on the user's description, extract the relevant information and output a JSON object.

User Description: "${description}"

The JSON object must match this structure exactly:
{
  "companyName": "string",
  "industry": "string",
  "targetedIndustries": "string",
  "services": "string",
  "usp": "string",
  "targetMarket": "Local" | "National" | "International",
  "geographicTarget": "string",
  "budgetLevel": "Low" | "Medium" | "High",
  "salesGoal": "string (number only)",
  "salesGoalCurrency": "USD" | "PKR",
  "outreachChannel": "WhatsApp" | "Email" | "LinkedIn" | "Cold Call" | "Multi-channel",
  "competitors": "string"
}

If any information is missing from the description, make a reasonable guess or leave it as an empty string, but ensure the structure is valid JSON.
`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            industry: { type: Type.STRING },
            targetedIndustries: { type: Type.STRING },
            services: { type: Type.STRING },
            usp: { type: Type.STRING },
            targetMarket: { type: Type.STRING },
            geographicTarget: { type: Type.STRING },
            budgetLevel: { type: Type.STRING },
            salesGoal: { type: Type.STRING },
            salesGoalCurrency: { type: Type.STRING },
            outreachChannel: { type: Type.STRING },
            competitors: { type: Type.STRING },
          },
          required: [
            "companyName",
            "industry",
            "targetedIndustries",
            "services",
            "usp",
            "targetMarket",
            "geographicTarget",
            "budgetLevel",
            "salesGoal",
            "salesGoalCurrency",
            "outreachChannel",
            "competitors",
          ],
        },
      },
    }),
  );

  return JSON.parse(response.text ?? "{}");
}

export async function generateText(prompt: string, model = DEFAULT_MODEL, highThinking = false) {
  const ai = getServerGenAI();
  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: highThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : undefined,
    }),
  );
  return response.text ?? "";
}

export async function generateLeadsText(prompt: string) {
  const ai = getServerGenAI();

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      },
    }),
  );

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const links: GroundingLink[] = [];
  const seen = new Set<string>();

  for (const chunk of groundingChunks) {
    const web = chunk.web;
    const maps = chunk.maps;

    if (web?.uri && !seen.has(web.uri)) {
      seen.add(web.uri);
      links.push({ title: web.title ?? "Source", uri: web.uri, type: "web" });
    }

    if (maps?.uri && !seen.has(maps.uri)) {
      seen.add(maps.uri);
      links.push({ title: maps.title ?? "Google Maps", uri: maps.uri, type: "maps" });
    }
  }

  return {
    text: response.text ?? "",
    links,
  };
}
