// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE, API_URL, REFRESH_COOKIE, clearAuthCookies, forbidden, isSameOrigin,
} from '@/lib/server';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  // Best-effort server-side revoke; always clear cookies locally.
  if (access && refresh) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: 'no-store',
    }).catch(() => {});
  }

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return res;
}