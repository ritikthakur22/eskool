// src/stores/auth-store.ts
import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/types';

// unknown = not checked yet (or invalidated, so we need to refetch)
type Status = 'unknown' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  user: AuthUser | null;
  status: Status;
  setUser: (user: AuthUser) => void;
  clear: () => void;      // logged out / session dead
  invalidate: () => void; // user = null + triggers refetch
  setError: () => void;   // server unreachable
}

// No `persist` middleware, so nothing ever touches localStorage.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, status: 'unauthenticated' }),
  invalidate: () => set({ user: null, status: 'unknown' }),
  setError: () => set({ user: null, status: 'error' }),
}));

// Anywhere outside React: useAuthStore.getState().user