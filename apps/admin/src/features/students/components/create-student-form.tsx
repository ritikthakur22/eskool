"use client";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { useCreateStudent } from "../hooks";
import { StudentForm } from "./student-form";

export function CreateStudentForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateStudent();

  return (
    <StudentForm
      mode="create"
      isPending={isPending}
      onSubmit={(payload) => mutate({ ...payload, password: payload.password ?? "" })}
      onCancel={() => router.push(ROUTES.students)}
    />
  );
}