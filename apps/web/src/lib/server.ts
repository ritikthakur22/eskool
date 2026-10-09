// src/lib/auth/server.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

export const API_URL = process.env.API_URL!;
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const isProd = process.env.NODE_ENV === 'production';

const baseCookie = {
  httpOnly: true,
  secure: isProd, // HTTPS-only in production (localhost dev is exempt)
  sameSite: 'lax' as const,
  path: '/',
};

// export function setAuthCookies(
//   res: NextResponse,
//   t: { access_token: string; refresh_token: string },
// ) {
//   res.cookies.set(ACCESS_COOKIE, t.access_token, { ...baseCookie, maxAge: 15 * 60 });
//   res.cookies.set(REFRESH_COOKIE, t.refresh_token, { ...baseCookie, maxAge: 30 * 24 * 60 * 60 });
// }

// export function clearAuthCookies(res: NextResponse) {
//   res.cookies.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 });
//   res.cookies.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 });
// }

export const PERSIST_COOKIE = 'session_persist';

export function setAuthCookies(
  res: NextResponse,
  t: { access_token: string; refresh_token: string },
  remember: boolean,
) {
  const longLived = remember ? { maxAge: 30 * 24 * 60 * 60 } : {}; // no maxAge = session cookie
  res.cookies.set(ACCESS_COOKIE, t.access_token, { ...baseCookie, maxAge: 15 * 60 });
  res.cookies.set(REFRESH_COOKIE, t.refresh_token, { ...baseCookie, ...longLived });
  res.cookies.set(PERSIST_COOKIE, remember ? '1' : '0', { ...baseCookie, ...longLived });
}

export function clearAuthCookies(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PERSIST_COOKIE]) {
    res.cookies.set(name, '', { ...baseCookie, maxAge: 0 });
  }
}

// CSRF defense in depth: state-changing requests must come from our own origin.
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return origin !== null && origin === process.env.APP_ORIGIN;
}

export const forbidden = () =>
  NextResponse.json({ message: 'Forbidden' }, { status: 403 });

// Your Nest rate-limit guard would otherwise see only the Next server's IP.
export function forwardedHeaders(req: NextRequest): Record<string, string> {
  const ip =
    req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  return ip ? { 'x-forwarded-for': ip } : {};
}