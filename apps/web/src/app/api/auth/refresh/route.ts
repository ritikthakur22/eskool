// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  API_URL, PERSIST_COOKIE, REFRESH_COOKIE, clearAuthCookies, forbidden, forwardedHeaders, isSameOrigin, setAuthCookies,
} from '@/lib/server';
import { toAuthUser } from '@/features/auth/types';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
    const remember = req.cookies.get(PERSIST_COOKIE)?.value === '1';
  if (!refreshToken) {
    const res = NextResponse.json({ message: 'No session' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardedHeaders(req) },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });
  } catch {
    // Network error: keep cookies, the session may still be valid.
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const res = NextResponse.json({ message: data?.message ?? 'Session expired' }, { status: upstream.status });
    if (upstream.status === 401) clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ user: toAuthUser(data.user) });
  setAuthCookies(res, data, remember);
  return res;
}