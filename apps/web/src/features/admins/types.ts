import type { Person } from "@/lib/people/types";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export type Admin = Person & {
  role: AdminRole;
  firstName: string;
  lastName: string;
  department: string | null;
};

export type AdminFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  password?: string;
};

export type CreateAdminInput = AdminFormValues & { password: string };
export type UpdateAdminInput = Omit<AdminFormValues, "password">;