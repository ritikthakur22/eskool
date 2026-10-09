// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  API_URL,
  forbidden,
  forwardedHeaders,
  isSameOrigin,
  setAuthCookies,
} from "@/lib/server";
import { toAuthUser } from "@/features/auth/types";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const body = await req.json().catch(() => null);
  const remember = body.remember === true;
  if (typeof body?.email !== "string" || typeof body?.password !== "string") {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardedHeaders(req) },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Service unavailable" },
      { status: 503 },
    );
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Login failed" },
      { status: upstream.status }, // passes through 401 / 429
    );
  }

  const res = NextResponse.json({ user: toAuthUser(data.user) });
  setAuthCookies(res, data, remember);
  return res;
}
