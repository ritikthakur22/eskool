// src/components/require-auth.tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/auth-store';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status === 'error') {
    return (
      <div>
        Can't reach the server.{' '}
        <button onClick={() => useAuthStore.getState().invalidate()}>Retry</button>
      </div>
    );
  }
  if (status !== 'authenticated') return null; // or a spinner
  return <>{children}</>;
}