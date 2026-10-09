import { api } from "@/lib/client";
import type { CreateStudentPayload, Student, StudentProfile, UpdateStudentPayload } from "./types";

// Shape returned by the NestJS users controller
type StudentDto = {
  id: string;
  email: string;
  role: string;
  status: string;
  disabledAt: string | null;
  createdAt: string;
  updatedAt?: string;
  studentProfile: (Pick<StudentProfile, "firstName" | "lastName"> & Partial<StudentProfile>) | null;
};

function toStudent(dto: StudentDto): Student {
  const p = dto.studentProfile;
  return {
    id: dto.id,
    email: dto.email,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
    disabledAt: dto.disabledAt,
    profile: {
      firstName: p?.firstName ?? "",
      lastName: p?.lastName ?? "",
      grade: p?.grade ?? null,
      section: p?.section ?? null,
      rollNo: p?.rollNo ?? null,
      dob: p?.dob ?? null,
      phone: p?.phone ?? null,
      gender: p?.gender ?? null,
      address: p?.address ?? null,
      parentName: p?.parentName ?? null,
      parentPhone: p?.parentPhone ?? null,
    },
  };
}

const withoutEmpty = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined));

export const studentsApi = {
  list: (status: string) =>
    api
      .get<StudentDto[]>("/users/admin/users", {
        params: { role: "STUDENT", status: status === "ALL" ? undefined : status },
      })
      .then((r) => r.data.map(toStudent)),

  async get(id: string) {
    const { data } = await api.get<StudentDto>(`/users/admin/users/${id}`);
    if (data.role !== "STUDENT") throw new Error("Student not found");
    return toStudent(data);
  },

  // Role defaults to STUDENT on the backend; empty optional fields are dropped
  create: (payload: CreateStudentPayload) =>
    api.post<{ id: string }>("/users/admin/create-user", withoutEmpty(payload)).then((r) => r.data),

  // Empty strings are intentional here: the backend turns them into null
  update: (id: string, payload: UpdateStudentPayload) =>
    api.patch<StudentDto>(`/users/admin/users/${id}`, payload).then((r) => toStudent(r.data)),

  disable: (id: string) =>
    api.post<{ id: string; status: string }>(`/users/admin/users/${id}/disable`).then((r) => r.data),

  restore: (id: string) =>
    api.post<{ id: string; status: string }>(`/users/admin/users/${id}/restore`).then((r) => r.data),
};