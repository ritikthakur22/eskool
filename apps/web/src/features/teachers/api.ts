import { createMockPeopleApi } from "@/lib/people/mock-store";
import { teachers } from "./mock-data";
import type { CreateTeacherInput, Teacher, UpdateTeacherInput } from "./types";

// Swap point: replace with real axios calls (see the note at the end).
export const teachersApi = createMockPeopleApi<Teacher, CreateTeacherInput, UpdateTeacherInput>({
  seed: teachers,
  build: (input, base) => ({
    ...base,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    subjects: input.subjects,
  }),
  apply: (current, input) => ({
    ...current,
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    subjects: input.subjects,
  }),
});