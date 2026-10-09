"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { useCreateStudent } from "../hooks";
import { StudentForm } from "./student-form";
import { StudentCredentialsDialog, type StudentCredentials } from "./student-credentials-dialog";

export function CreateStudentForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateStudent();
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);

  return (
    <>
      <StudentForm
        mode="create"
        isPending={isPending}
        onSubmit={(payload) => {
          const password = payload.password ?? "";
          mutate(
            { ...payload, password },
            {
              onSuccess: (created) =>
                setCredentials({
                  name: `${payload.firstName} ${payload.lastName}`.trim(),
                  email: created.email,
                  // userId: created.userId,
                  password,
                }),
            },
          );
        }}
        onCancel={() => router.push(ROUTES.students)}
      />
      <StudentCredentialsDialog
        credentials={credentials}
        onDone={() => {
          setCredentials(null);
          router.push(ROUTES.students);
        }}
      />
    </>
  );
}