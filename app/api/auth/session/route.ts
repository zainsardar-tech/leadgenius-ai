import { NextResponse } from "next/server";
import { getAuthCookieName, verifySessionToken } from "@/lib/server/auth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieName = getAuthCookieName();

  const token = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  const payload = verifySessionToken(token ?? null);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: payload.email,
      role: payload.role,
    },
  });
}
