"use client";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { useStudent, useUpdateStudent } from "../hooks";
import { StudentForm } from "./student-form";
import { StudentNotFound } from "./student-not-found";

export function EditStudentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: student, isLoading, isError } = useStudent(userId);
  const { mutate, isPending } = useUpdateStudent(userId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  if (isError || !student) return <StudentNotFound />;

  return (
    <StudentForm
      key={student.id}
      mode="edit"
      student={student}
      isPending={isPending}
      onSubmit={(p) =>
        // Only the fields the admin PATCH endpoint accepts
        mutate({
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          grade: p.grade,
          section: p.section,
          rollNo: p.rollNo,
        })
      }
      onCancel={() => router.push(ROUTES.studentDetail(userId))}
    />
  );
}