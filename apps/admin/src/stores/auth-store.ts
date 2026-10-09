// src/stores/auth-store.ts
import { create } from "zustand";
import type { AuthUser } from "@/features/auth/types";

type Status = "unknown" | "authenticated" | "unauthenticated" | "error";

interface AuthState {
  user: AuthUser | null;
  status: Status;
  intentionalLogout: boolean; // true when the user clicked "Log out"
  setUser: (user: AuthUser) => void;
  clear: (intentional?: boolean) => void;
  invalidate: () => void;
  setError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "unknown",
  intentionalLogout: false,
  setUser: (user) =>
    set({ user, status: "authenticated", intentionalLogout: false }),
  clear: (intentional = false) =>
    set({
      user: null,
      status: "unauthenticated",
      intentionalLogout: intentional,
    }),
  invalidate: () => set({ user: null, status: "unknown" }),
  setError: () => set({ user: null, status: "error" }),
}));
