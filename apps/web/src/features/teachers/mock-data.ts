import type { Teacher } from "./types";

// Will come from the Subjects API later (autocomplete only, any text is allowed)
export const SUBJECT_SUGGESTIONS = [
  "Mathematics", "English", "Nepali", "Science", "Social Studies", "Computer Science",
  "Physics", "Chemistry", "Biology", "Accountancy", "Economics", "Health",
  "Physical Education", "Art", "Music", "Geography", "History", "Moral Education",
];

const seed: [string, string, string[]][] = [
  ["Rajesh", "Adhikari", ["Mathematics", "Physics"]],
  ["Sunita", "Poudel", ["English"]],
  ["Bishnu", "Khanal", ["Nepali", "Social Studies"]],
  ["Gita", "Bhattarai", ["Science", "Health"]],
  ["Deepak", "Subedi", ["Computer Science", "Mathematics"]],
  ["Mina", "Rai", ["Art", "Music"]],
  ["Kamal", "Karki", ["Physical Education"]],
  ["Roshani", "Shrestha", ["Accountancy", "Economics"]],
  ["Prem", "Gurung", ["Chemistry", "Biology"]],
  ["Anju", "Basnet", ["English", "Moral Education"]],
  ["Tej", "Lama", ["Geography", "History"]],
  ["Sarita", "Neupane", ["Nepali"]],
];

export const teachers: Teacher[] = seed.map(([firstName, lastName, subjects], i) => {
  const createdAt = new Date(Date.UTC(2025, 5, 3 + i * 17)).toISOString();
  const disabled = i === 5;

  return {
    id: `tch_${String(i + 1).padStart(4, "0")}`,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    status: disabled ? "DISABLED" : "ACTIVE",
    createdAt,
    updatedAt: createdAt,
    disabledAt: disabled ? new Date(Date.UTC(2026, 8, 1)).toISOString() : null,
    firstName,
    lastName,
    subjects,
  };
});