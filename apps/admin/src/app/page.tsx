// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const store = await cookies();
  const hasSession = store.has("access_token") || store.has("refresh_token");
  redirect(hasSession ? "/dashboard" : "/login");
}
