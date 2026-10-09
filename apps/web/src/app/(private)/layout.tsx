"use client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { RequireAuth } from "@/components/shared/require-auth";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <RequireAuth>
        <div className="flex min-h-screen bg-muted/30">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
