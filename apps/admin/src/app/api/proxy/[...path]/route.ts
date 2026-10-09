// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, API_URL, forbidden, isSameOrigin } from '@/lib/server';

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  const hasBody = !['GET', 'HEAD'].includes(req.method);

  if (hasBody && !isSameOrigin(req)) return forbidden();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }

  const resHeaders = new Headers();
  for (const h of ['content-type', 'content-disposition']) {
    const v = upstream.headers.get(h);
    if (v) resHeaders.set(h, v);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };