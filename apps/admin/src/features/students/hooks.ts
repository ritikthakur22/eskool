import { useCallback } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/client";
import { studentsApi } from "./api";
import type { Student, StudentsQuery, UpdateStudentPayload } from "./types";
import { filterStudents, paginate } from "./utils";

export const studentKeys = {
  all: ["students"] as const,
  lists: ["students", "list"] as const,
  list: (status: string) => ["students", "list", status] as const,
  detail: (id: string) => ["students", "detail", id] as const,
};

// One request per status filter; search and pagination run on the cached list,
// so typing and paging are instant and don't hit the backend.
export const useStudents = ({ page, pageSize, search, status }: StudentsQuery) => {
  const select = useCallback(
    (students: Student[]) => paginate(filterStudents(students, search), page, pageSize),
    [page, pageSize, search]
  );

  return useQuery({
    queryKey: studentKeys.list(status),
    queryFn: () => studentsApi.list(status),
    select,
    placeholderData: keepPreviousData,
  });
};

export const useStudent = (id: string) =>
  useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.get(id),
    retry: false,
  });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.lists });
      toast.success("Student added");
      router.push(ROUTES.students);
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
      qc.setQueryData(studentKeys.detail(id), student); // detail page updates instantly
      qc.invalidateQueries({ queryKey: studentKeys.lists });
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
    onSuccess: (_data, { active }) => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(active ? "Student restored" : "Student disabled");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};