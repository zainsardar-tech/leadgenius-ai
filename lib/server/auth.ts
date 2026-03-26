import crypto from "node:crypto";

export type AuthPayload = {
  email: string;
  role: "admin" | "member";
  exp: number;
};

const AUTH_COOKIE = "leadgenius_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const base64urlEncode = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64urlDecode = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf-8");
};

const getSecret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me";

const sign = (value: string) => base64urlEncode(crypto.createHmac("sha256", getSecret()).update(value).digest());

export function createSessionToken(email: string, role: "admin" | "member") {
  const payload: AuthPayload = {
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(payloadJson);
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token?: string | null): AuthPayload | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64)) as AuthPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.email || (payload.role !== "admin" && payload.role !== "member")) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export function validateUser(email: string, password: string): { role: "admin" | "member" } | null {
  const adminEmail = process.env.APP_ADMIN_EMAIL;
  const adminPassword = process.env.APP_ADMIN_PASSWORD;
  const memberEmail = process.env.APP_MEMBER_EMAIL;
  const memberPassword = process.env.APP_MEMBER_PASSWORD;

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    return { role: "admin" };
  }

  if (memberEmail && memberPassword && email === memberEmail && password === memberPassword) {
    return { role: "member" };
  }

  return null;
}
