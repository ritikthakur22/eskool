// src/features/auth/hooks/index.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/client";
import type { AuthUser } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

export type LoginInput = { email: string; password: string; remember: boolean };

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  return {
    user,
    status,
    isLoading: status === "unknown",
    isAuthenticated: status === "authenticated",
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (v: LoginInput) =>
      (await authApi.post<{ user: AuthUser }>("/login", v)).data.user,
    onSuccess: (user) => {
      queryClient.clear();
      useAuthStore.getState().setUser(user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.post("/logout"),
    // onSettled (not onSuccess): even if the server call fails, the user is signed out locally.
    onSettled: () => {
      useAuthStore.getState().clear(true);
      queryClient.clear();
    },
  });
}
