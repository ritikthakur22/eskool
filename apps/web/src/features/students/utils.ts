import type { Student, StudentProfile, StudentsPage } from "./types";

export const getStudentName = (s: Student) =>
  `${s.profile.firstName} ${s.profile.lastName}`.trim() || s.email;

export const formatClass = (p: Pick<StudentProfile, "grade" | "section">) =>
  [p.grade, p.section].filter(Boolean).join(" - ") || "—";

export function filterStudents(students: Student[], search: string): Student[] {
  const q = search.trim().toLowerCase();
  if (!q) return students;

  return students.filter(
    (s) =>
      getStudentName(s).toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.profile.rollNo ?? "").toLowerCase().includes(q)
  );
}

export function paginate(students: Student[], page: number, pageSize: number): StudentsPage {
  const start = (page - 1) * pageSize;
  return { data: students.slice(start, start + pageSize), total: students.length };
}