import { api } from "@/lib/client";
import type { CreatedStudent, CreateStudentPayload, Student, StudentProfile, UpdateStudentPayload } from "./types";

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
    profilePictureUrl: null, // no admin-facing photo endpoint
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
      dobBs: p?.dobBs ?? null,
      gender: p?.gender ?? null,
      bloodGroup: p?.bloodGroup ?? null,
      phone: p?.phone ?? null,
      address: p?.address ?? null,
      temporaryAddress: p?.temporaryAddress ?? null,
      admissionDate: p?.admissionDate ?? null,
      fatherName: p?.fatherName ?? null,
      fatherPhone: p?.fatherPhone ?? null,
      motherName: p?.motherName ?? null,
      motherPhone: p?.motherPhone ?? null,
    },
  };
}

const withoutEmpty = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined));

export const studentsApi = {
  // Backend returns a plain array (max 100)
  list: (status: string, signal?: AbortSignal) =>
    api
      .get<StudentDto[]>("/users/admin/users", {
        params: { role: "STUDENT", status: status === "ALL" ? undefined : status },
        signal,
      })
      .then((r) => (Array.isArray(r.data) ? r.data : []).map(toStudent)),

  // Full profile from GET /users/admin/users/:id
  async get(id: string) {
    const { data } = await api.get<StudentDto>(`/users/admin/users/${id}`);
    if (data.role !== "STUDENT") throw new Error("Student not found");
    return toStudent(data);
  },

  create: (payload: CreateStudentPayload) =>
    api.post<CreatedStudent>("/users/admin/create-user", withoutEmpty(payload)).then((r) => r.data),

  // Empty strings are intentional: the backend turns them into null
  update: (id: string, payload: UpdateStudentPayload) =>
    api.patch<StudentDto>(`/users/admin/users/${id}`, payload).then((r) => toStudent(r.data)),

  disable: (id: string) =>
    api.post<{ id: string; status: string }>(`/users/admin/users/${id}/disable`).then((r) => r.data),

  restore: (id: string) =>
    api.post<{ id: string; status: string }>(`/users/admin/users/${id}/restore`).then((r) => r.data),
};