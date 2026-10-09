"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
         <AuthProvider>{children}</AuthProvider>
        <Toaster richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}