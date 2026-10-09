"use client";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { useStudent, useUpdateStudent } from "../hooks";
import { StudentForm } from "./student-form";
import { StudentNotFound } from "./student-not-found";

export function EditStudentForm({ userId }: { userId: string }) {
  const router = useRouter();

  const {
    data: student,
    isLoading,
    isError,
  } = useStudent(userId);

  const { mutate, isPending } = useUpdateStudent(userId);

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    );
  }

  if (isError || !student) {
    return <StudentNotFound />;
  }

  return (
    <StudentForm
      mode="edit"
      student={student}
      isPending={isPending}
      onSubmit={(payload) => {
        mutate(payload, {
          onSuccess: () => {
            router.push(ROUTES.studentDetail(userId));
          },
        });
      }}
      onCancel={() => router.push(ROUTES.studentDetail(userId))}
    />
  );
}
