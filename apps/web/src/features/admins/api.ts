import { createMockPeopleApi } from "@/lib/people/mock-store";
import { admins } from "./mock-data";
import type { Admin, CreateAdminInput, UpdateAdminInput } from "./types";

// Swap point: replace with real axios calls (see the note at the end).
export const adminsApi = createMockPeopleApi<Admin, CreateAdminInput, UpdateAdminInput>({
  seed: admins,
  build: (input, base) => ({
    ...base,
    role: "ADMIN", // SUPER_ADMIN can't be created through the normal API
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    department: input.department.trim() || null,
  }),
  apply: (current, input) => ({
    ...current,
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    department: input.department.trim() || null,
  }),
});