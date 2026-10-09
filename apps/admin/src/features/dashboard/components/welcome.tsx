"use client";

// import { useAuthStore } from "@/store/auth-store";

export function Welcome() {
//   const user = useAuthStore((s) => s.user);
const user = {name: "Aadarsh"}

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Welcome back, <span className="font-bold">{user?.name ?? "Admin"}</span>!
      </h1>
      <p className="text-muted-foreground">Track your school&apos;s performance and activity.</p>
    </div>
  );
}