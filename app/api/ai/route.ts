import { NextResponse } from "next/server";
import { getAuthCookieName, verifySessionToken } from "@/lib/server/auth";
import { BusinessProfile, generateJsonMagicProfile, generateLeadsText, generateText } from "@/lib/server/gemini";
import { Lead, parseLeadsFromText } from "@/lib/server/leads";

type AiAction = "magicFill" | "strategy" | "leads" | "outreachGeneral" | "outreachLead" | "report";

type AiBody = {
  action?: AiAction;
  profile?: BusinessProfile;
  description?: string;
  leads?: Lead[];
  lead?: Lead;
  existingLeadKeys?: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const leadKey = (lead: Pick<Lead, "businessName" | "location">) => `${normalize(lead.businessName)}|${normalize(lead.location)}`;

const readSession = (request: Request) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieName = getAuthCookieName();

  const token = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  return verifySessionToken(token ?? null);
};

const requireProfile = (profile?: BusinessProfile) => {
  if (!profile?.companyName || !profile?.industry || !profile?.services || !profile?.targetedIndustries) {
    throw new Error("PROFILE_INCOMPLETE");
  }
  return profile;
};

export async function POST(request: Request) {
  const session = readSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AiBody;

    switch (body.action) {
      case "magicFill": {
        if (!body.description?.trim()) {
          return NextResponse.json({ error: "Description is required." }, { status: 400 });
        }
        const profile = await generateJsonMagicProfile(body.description);
        return NextResponse.json({ profile });
      }

      case "strategy": {
        const profile = requireProfile(body.profile);
        const prompt = `
You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
Analyze the following business profile and provide a comprehensive strategy report.

Business Profile:
- Company Name: ${profile.companyName}
- Industry: ${profile.industry}
- Targeted Industries: ${profile.targetedIndustries}
- Services/Products: ${profile.services}
- USP: ${profile.usp}
- Target Market: ${profile.targetMarket}
- Budget Level: ${profile.budgetLevel}
- Sales Goal: ${profile.salesGoal} ${profile.salesGoalCurrency}
- Preferred Outreach Channel: ${profile.outreachChannel}
- Geographic Target: ${profile.geographicTarget}
- Competitors: ${profile.competitors}

Please provide a detailed report with the following sections:
1. Business Model Analysis
2. Best Industries to Target & Most Profitable Niche
3. Expected Close Rate Strategy
4. 30-Day Action Plan
5. 90-Day Sales Scaling Strategy
`;

        const text = await generateText(prompt, "gemini-2.5-pro", true);
        return NextResponse.json({ text });
      }

      case "leads": {
        const profile = requireProfile(body.profile);
        const existingKeys = new Set(body.existingLeadKeys ?? []);

        const prompt = `
You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
Find highly qualified business leads in ${profile.geographicTarget} for this profile.

Business Profile:
- Industry: ${profile.industry}
- Targeted Industries: ${profile.targetedIndustries}
- Services/Products: ${profile.services}
- Target Market: ${profile.targetMarket}

Rules:
- Return only businesses that are likely to buy this offer.
- Avoid duplicates.
- Avoid generic or irrelevant entities.
- Include only businesses with specific location context.
- Prefer results with clear sales-angle opportunities.

Format each lead exactly as:
---LEAD_START---
Business Name: [Name]
Business Type: [Type]
Location: [Location]
Rating: [Rating]
Why High Potential: [Reason]
Sales Angle: [Angle]
Classification: [Hot/Warm/Cold]
---LEAD_END---

Generate 12 distinct leads.
`;

        const generated = await generateLeadsText(prompt);
        const parsed = parseLeadsFromText(generated.text, "lead");
        const leads = parsed.filter((lead) => {
          const key = leadKey(lead);
          if (!key || existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });

        return NextResponse.json({ leads, links: generated.links, rawText: generated.text });
      }

      case "outreachGeneral": {
        const profile = requireProfile(body.profile);
        const leads = body.leads ?? [];

        const leadsContext = leads.length
          ? `Here are the generated leads to personalize for:\n${leads
              .slice(0, 10)
              .map((lead) => `- ${lead.businessName} (${lead.businessType}): ${lead.salesAngle}`)
              .join("\n")}`
          : "No specific leads generated yet, provide general templates.";

        const prompt = `
You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
Generate personalized outreach messages based on the business profile.

Business Profile:
- Company Name: ${profile.companyName}
- Services/Products: ${profile.services}
- USP: ${profile.usp}
- Preferred Outreach Channel: ${profile.outreachChannel}

${leadsContext}

Generate specialized outreach templates for EACH listed lead (or general if none).
For each lead provide:
1. Initial outreach message
2. Follow-up message for Day 2
3. Final follow-up message for Day 5

Messages must be personalized, value-first, clear CTA, and channel-appropriate.
`;

        const text = await generateText(prompt, "gemini-2.5-flash");
        return NextResponse.json({ text });
      }

      case "outreachLead": {
        const profile = requireProfile(body.profile);
        const lead = body.lead;

        if (!lead?.businessName || !lead.salesAngle) {
          return NextResponse.json({ error: "Lead payload is incomplete." }, { status: 400 });
        }

        const prompt = `
You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
Generate a highly personalized outreach sequence.

My Business Profile:
- Company Name: ${profile.companyName}
- Services/Products: ${profile.services}
- USP: ${profile.usp}
- Preferred Outreach Channel: ${profile.outreachChannel}

Target Lead:
- Business Name: ${lead.businessName}
- Business Type: ${lead.businessType}
- Sales Angle: ${lead.salesAngle}
- Why High Potential: ${lead.whyHighPotential}

Provide:
1. Initial outreach message
2. Follow-up for Day 2
3. Final follow-up for Day 5
`;

        const text = await generateText(prompt, "gemini-2.5-flash");
        return NextResponse.json({ text });
      }

      case "report": {
        if (session.role !== "admin") {
          return NextResponse.json({ error: "Insufficient permissions for report generation." }, { status: 403 });
        }

        const profile = requireProfile(body.profile);
        const leads = body.leads ?? [];

        const hot = leads.filter((lead) => lead.classification.toLowerCase().includes("hot")).length;
        const warm = leads.filter((lead) => lead.classification.toLowerCase().includes("warm")).length;
        const cold = leads.filter((lead) => lead.classification.toLowerCase().includes("cold")).length;

        const prompt = `
You are an Advanced AI Lead Intelligence & Sales Strategy Expert.
Generate a final strategy summary report.

Business Profile:
- Company Name: ${profile.companyName}
- Industry: ${profile.industry}
- Targeted Industries: ${profile.targetedIndustries}
- Target Market: ${profile.targetMarket}
- Budget Level: ${profile.budgetLevel}
- Sales Goal: ${profile.salesGoal} ${profile.salesGoalCurrency}

Generated Leads: ${leads.length}
Hot Leads: ${hot}
Warm Leads: ${warm}
Cold Leads: ${cold}

Provide sections:
1. Total Leads Generated & Breakdown
2. Industry Opportunity Level
3. Expected Conversion Rate
4. Estimated Revenue Potential
5. Final Recommendations
`;

        const text = await generateText(prompt, "gemini-2.5-pro", true);
        return NextResponse.json({ text });
      }

      default:
        return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    if (message === "PROFILE_INCOMPLETE") {
      return NextResponse.json({ error: "Please complete required business profile fields." }, { status: 400 });
    }

    if (message === "GEMINI_API_KEY_MISSING") {
      return NextResponse.json({ error: "Server API key missing. Set GEMINI_API_KEY in environment." }, { status: 500 });
    }

    if (message.toLowerCase().includes("quota") || message.includes("429")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please retry in a moment." }, { status: 429 });
    }

    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
