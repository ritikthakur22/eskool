// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, API_URL } from '@/lib/server';
import { toAuthUser } from '@/features/auth/types';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
  const data = await upstream.json()

  if (!upstream.ok) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: upstream.status });
  }
  return NextResponse.json({ user: toAuthUser(data) });
}