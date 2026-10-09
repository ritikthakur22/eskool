// src/middleware.ts   (rename to src/proxy.ts if you're on Next 16)
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession = req.cookies.has('access_token') || req.cookies.has('refresh_token');

  if (PUBLIC_PATHS.includes(pathname)){
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next();
  } 

  // Either cookie means "might be signed in". If the access token expired, the
  // client refreshes with the refresh cookie.
  if (!hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};