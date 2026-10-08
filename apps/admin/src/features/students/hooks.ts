import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/error";
import { studentsApi } from "./api";
import type { StudentsQuery } from "./types";

export const studentKeys = {
  all: ["students"] as const,
  list: (query: StudentsQuery) => ["students", "list", query] as const,
};

export const useStudents = (query: StudentsQuery) =>
  useQuery({
    queryKey: studentKeys.list(query),
    queryFn: () => studentsApi.list(query),
    placeholderData: keepPreviousData,
  });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Student added");
      router.push(ROUTES.students);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: studentsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Student deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};