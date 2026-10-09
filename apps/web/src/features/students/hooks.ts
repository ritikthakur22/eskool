import { useCallback } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/client";
import { studentsApi } from "./api";
import { studentKeys } from "./keys";
import type { Student, StudentsPage, StudentsQuery, UpdateStudentPayload, CreateStudentPayload } from "./types";

const LIST_STALE_TIME = 60_000;
const DETAIL_STALE_TIME = 60_000;

function filterStudents(students: Student[], search: string): Student[] {
  const q = search.trim().toLowerCase();
  if (!q) return students;
  return students.filter((s) =>
    [`${s.profile.firstName} ${s.profile.lastName}`, s.email, s.profile.rollNo, s.id].some((v) =>
      v?.toLowerCase().includes(q),
    ),
  );
}

function paginate(students: Student[], page: number, pageSize: number): StudentsPage {
  const start = (page - 1) * pageSize;
  return { data: students.slice(start, start + pageSize), total: students.length };
}

/** Apply `fn` to every cached list (one per status filter). */
function patchLists(qc: QueryClient, fn: (list: Student[], status: string) => Student[]) {
  for (const q of qc.getQueryCache().findAll({ queryKey: studentKeys.lists() })) {
    const status = q.queryKey[2] as string;
    qc.setQueryData<Student[]>(q.queryKey, (old) => (old ? fn(old, status) : old));
  }
}

export const useStudents = ({ page, pageSize, search, status }: StudentsQuery) => {
  const select = useCallback(
    (students: Student[]) => paginate(filterStudents(students, search), page, pageSize),
    [page, pageSize, search],
  );

  return useQuery({
    queryKey: studentKeys.list(status),
    queryFn: ({ signal }) => studentsApi.list(status, signal),
    select,
    placeholderData: keepPreviousData,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false
  });
};

export const useStudent = (id: string) =>
  useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.get(id),
    retry: false,
    staleTime: DETAIL_STALE_TIME,
    refetchOnWindowFocus: false
  });

// No redirect here: the create form shows the credentials popup first, then navigates.
export const useCreateStudent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: (created, vars: CreateStudentPayload) => {
      const now = new Date().toISOString();
      const student: Student = {
        id: created.id,
        email: created.email,
        status: created.status ?? "ACTIVE",
        profilePictureUrl: null,
        createdAt: created.createdAt ?? now,
        updatedAt: created.updatedAt ?? null,
        disabledAt: created.disabledAt ?? null,
        profile: {
          firstName: vars.firstName,
          lastName: vars.lastName,
          grade: vars.grade || null,
          section: vars.section || null,
          rollNo: vars.rollNo || null,
          dob: null, dobBs: null, gender: null, bloodGroup: null, phone: null, address: null,
          temporaryAddress: null, admissionDate: null, fatherName: null, fatherPhone: null,
          motherName: null, motherPhone: null,
        },
      };
      // Backend sorts newest first, so prepend instead of refetching
      patchLists(qc, (list, status) =>
        status === "ALL" || status === student.status ? [student, ...list] : list,
      );
      toast.success("Student added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useUpdateStudent = (id: string) => {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: UpdateStudentPayload) => studentsApi.update(id, payload),
    onSuccess: (student) => {
      // The server returns the full updated record, so patch caches instead of refetching
      qc.setQueryData(studentKeys.detail(id), student);
      patchLists(qc, (list) => list.map((s) => (s.id === id ? student : s)));
      toast.success("Student updated");
      router.push(ROUTES.studentDetail(id));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useSetStudentStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? studentsApi.restore(id) : studentsApi.disable(id),
    onSuccess: ({ id, status }, { active }) => {
      const disabledAt = active ? null : new Date().toISOString();

      patchLists(qc, (list, listStatus) => {
        // Filtered list ("Active"/"Disabled"): the row no longer belongs there
        if (listStatus !== "ALL" && listStatus !== status) return list.filter((s) => s.id !== id);
        return list.map((s) => (s.id === id ? { ...s, status, disabledAt } : s));
      });
      qc.setQueryData<Student>(studentKeys.detail(id), (old) => old && { ...old, status, disabledAt });

      toast.success(active ? "Student restored" : "Student disabled");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};