"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Student, StudentFormPayload } from "../types";

type Mode = "create" | "edit";

const buildSchema = (mode: Mode) =>
  z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Enter a valid email"),
    grade: z.string().trim().max(50).optional(),
    section: z.string().trim().max(50).optional(),
    rollNo: z.string().trim().max(50).optional(),
    password:
      mode === "create"
        ? z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password must be at most 128 characters")
        : z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toDefaults(student?: Student): FormValues {
  return {
    firstName: student?.profile.firstName ?? "",
    lastName: student?.profile.lastName ?? "",
    email: student?.email ?? "",
    grade: student?.profile.grade ?? "",
    section: student?.profile.section ?? "",
    rollNo: student?.profile.rollNo ?? "",
    password: "",
  };
}

type StudentFormProps = {
  mode: Mode;
  student?: Student;
  isPending: boolean;
  onSubmit: (payload: StudentFormPayload) => void;
  onCancel: () => void;
};

const inputClass = "h-11 rounded-xl";

export function StudentForm({ mode, student, isPending, onSubmit, onCancel }: StudentFormProps) {
  const schema = useMemo(() => buildSchema(mode), [mode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(student),
  });

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onSubmit({
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          grade: v.grade ?? "",
          section: v.section ?? "",
          rollNo: v.rollNo ?? "",
          password: v.password || undefined,
        })
      )}
      className="space-y-8"
    >
      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">General Information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
            <Input id="firstName" placeholder="First Name" className={inputClass} {...register("firstName")} />
          </FormField>
          <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
            <Input id="lastName" placeholder="Last Name" className={inputClass} {...register("lastName")} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="Email" className={inputClass} {...register("email")} />
          </FormField>
          {mode === "create" && (
            <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className={inputClass}
                {...register("password")}
              />
            </FormField>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Academic Information</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Grade" htmlFor="grade" error={errors.grade?.message}>
            <Input id="grade" placeholder="e.g. 10" className={inputClass} {...register("grade")} />
          </FormField>
          <FormField label="Section" htmlFor="section" error={errors.section?.message}>
            <Input id="section" placeholder="e.g. A" className={inputClass} {...register("section")} />
          </FormField>
          <FormField label="Roll Number" htmlFor="rollNo" error={errors.rollNo?.message}>
            <Input id="rollNo" placeholder="Roll number" className={inputClass} {...register("rollNo")} />
          </FormField>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="h-11 rounded-xl px-8 text-destructive"
          onClick={onCancel}
        >
          {mode === "create" ? "Discard" : "Cancel"}
        </Button>
        <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-10">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Add" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}