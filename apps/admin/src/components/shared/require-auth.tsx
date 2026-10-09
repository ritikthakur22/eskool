// src/components/require-auth.tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks";
import { useAuthStore } from "@/stores/auth-store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const intentional = useAuthStore((s) => s.intentionalLogout);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    router.replace(
      intentional
        ? ROUTES.login
        : `${ROUTES.login}?next=${encodeURIComponent(pathname)}`,
    );
  }, [status, intentional, pathname, router]);

  if (status === "error") {
    return (
      <div>
        Can't reach the server.{" "}
        <button onClick={() => useAuthStore.getState().invalidate()}>
          Retry
        </button>
      </div>
    );
  }
  if (status !== "authenticated") return null;
  return <>{children}</>;
}
