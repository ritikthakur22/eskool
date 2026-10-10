import type { Teacher } from "./types";

export const getTeacherName = (t: Teacher) => `${t.firstName} ${t.lastName}`.trim() || t.email;