import { students as seed } from "./mock-data";
import type { CreateStudentPayload, Student, StudentsPage, StudentsQuery } from "./types";

// In-memory store: resets on a full page reload.
// When the backend is ready, replace each method with an axios call, e.g.
//   list: (params) => api.get<StudentsPage>("/students", { params }).then((r) => r.data)
let db: Student[] = [...seed];

const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const studentsApi = {
  async list({ page, pageSize, search, status }: StudentsQuery): Promise<StudentsPage> {
    await wait();
    const q = search.trim().toLowerCase();

    const filtered = db.filter(
      (s) =>
        (status === "ALL" || s.status === status) &&
        (!q ||
          s.profile.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q))
    );

    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total: filtered.length };
  },

  async create(payload: CreateStudentPayload): Promise<Student> {
    await wait(500);

    if (db.some((s) => s.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("A user with this email already exists");
    }

    const student: Student = {
      id: `stu_${Date.now().toString(36)}`,
      email: payload.email,
      status: payload.status,
      schoolId: "sch_01",
      createdAt: new Date().toISOString(),
      disabledAt: payload.status === "DISABLED" ? new Date().toISOString() : null,
      profilePictureUrl: payload.profilePictureUrl,
      profile: {
        fullName: payload.fullName,
        phone: payload.phone || null,
        address: payload.address || null,
        className: payload.className || null,
      },
    };

    db = [student, ...db]; // password is never stored in the mock
    return student;
  },

  async remove(id: string): Promise<void> {
    await wait();
    db = db.filter((s) => s.id !== id);
  },
};