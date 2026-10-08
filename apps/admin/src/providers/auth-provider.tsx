// src/providers/auth-provider.tsx
'use client';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';
import { authApi } from '@/lib/client';
import type { AuthUser } from '@/features/auth/types';
import { useAuthStore } from '@/stores/auth-store';

export const authKeys = { me: ['auth', 'me'] as const };

const fetchMe = async () => (await authApi.get<{ user: AuthUser }>('/me')).data.user;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);

  // Runs on first load AND whenever the store is reset to "unknown" (user = null).
  useEffect(() => {
    if (status !== 'unknown') return;
    const { setUser, clear, setError } = useAuthStore.getState();

    queryClient
      .fetchQuery({ queryKey: authKeys.me, queryFn: fetchMe, staleTime: 0 }) // dedupes in-flight calls
      .then(setUser)
      .catch((e) => (axios.isAxiosError(e) && e.response?.status === 401 ? clear() : setError()));
  }, [status, queryClient]);

  // Drop all cached server data when the session ends.
  useEffect(() => {
    if (status === 'unauthenticated') queryClient.clear();
  }, [status, queryClient]);

  return <>{children}</>;
}