"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { EntityNotFound } from "@/components/shared/entity-not-found";
import { FormField } from "@/components/shared/form-field";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { teacherHooks } from "../hooks";
import { SUBJECT_SUGGESTIONS } from "../mock-data";
import type { Teacher, TeacherFormValues } from "../types";

type Mode = "create" | "edit";

const buildSchema = (mode: Mode) =>
  z.object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().email("Enter a valid email").max(254),
    password:
      mode === "create"
        ? z.string().min(8, "Password must be at least 8 characters").max(128, "Max 128 characters")
        : z.string(),
    subjects: z.array(z.string()).max(20, "At most 20 subjects"),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const inputClass = "h-11 rounded-xl";

type TeacherFormProps = {
  mode: Mode;
  teacher?: Teacher;
  isPending: boolean;
  onSubmit: (values: TeacherFormValues) => void;
  onCancel: () => void;
};

export function TeacherForm({ mode, teacher, isPending, onSubmit, onCancel }: TeacherFormProps) {
  const schema = useMemo(() => buildSchema(mode), [mode]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: teacher?.firstName ?? "",
      lastName: teacher?.lastName ?? "",
      email: teacher?.email ?? "",
      password: "",
      subjects: teacher?.subjects ?? [],
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, password: v.password || undefined }))}
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
        <h2 className="border-b pb-3 text-lg font-semibold">Teaching</h2>
        <FormField label="Subjects" htmlFor="subjects" error={errors.subjects?.message}>
          <Controller
            control={control}
            name="subjects"
            render={({ field }) => (
              <TagInput
                id="subjects"
                value={field.value}
                onChange={field.onChange}
                suggestions={SUBJECT_SUGGESTIONS}
                placeholder="e.g. Mathematics"
              />
            )}
          />
        </FormField>
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

export function CreateTeacherForm() {
  const router = useRouter();
  const { mutate, isPending } = teacherHooks.useCreate();

  return (
    <TeacherForm
      mode="create"
      isPending={isPending}
      onSubmit={(v) => mutate({ ...v, password: v.password ?? "" })}
      onCancel={() => router.push(ROUTES.teachers)}
    />
  );
}

export function EditTeacherForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: teacher, isLoading, isError, isPlaceholderData } = teacherHooks.useOne(userId);
  const { mutate, isPending } = teacherHooks.useUpdate(userId);

  if (isError) return <EntityNotFound noun="teacher" backHref={ROUTES.teachers} />;
  // Wait for the full record so nothing is saved blank from partial list data
  if (isLoading || isPlaceholderData || !teacher) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <TeacherForm
      key={teacher.id}
      mode="edit"
      teacher={teacher}
      isPending={isPending}
      onSubmit={(v) => mutate(v)}
      onCancel={() => router.push(ROUTES.teacherDetail(userId))}
    />
  );
}