import type { Admin } from "./types";

// Will come from your own list later (autocomplete only, any text is allowed)
export const DEPARTMENT_SUGGESTIONS = [
  "Administration", "Finance", "Academics", "Examinations", "IT", "Library", "Transport",
];

const seed: [string, string, string][] = [
  ["Binita", "Sharma", "Administration"],
  ["Suresh", "Pokhrel", "Finance"],
  ["Laxmi", "Dhakal", "Academics"],
  ["Narayan", "Acharya", "IT"],
  ["Rupa", "Khatri", "Examinations"],
  ["Hem", "Bista", "Administration"],
];

export const admins: Admin[] = seed.map(([firstName, lastName, department], i) => {
  const createdAt = new Date(Date.UTC(2025, 2, 10 + i * 23)).toISOString();
  const disabled = i === 4;

  return {
    id: `adm_${String(i + 1).padStart(4, "0")}`,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    status: disabled ? "DISABLED" : "ACTIVE",
    createdAt,
    updatedAt: createdAt,
    disabledAt: disabled ? new Date(Date.UTC(2026, 8, 1)).toISOString() : null,
    role: "ADMIN",
    firstName,
    lastName,
    department,
  };
});