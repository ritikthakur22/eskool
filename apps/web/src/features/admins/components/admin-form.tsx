"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { EntityNotFound } from "@/components/shared/entity-not-found";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { adminHooks } from "../hooks";
import { DEPARTMENT_SUGGESTIONS } from "../mock-data";
import type { Admin, AdminFormValues } from "../types";

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
    department: z.string().trim().max(100, "Max 100 characters"),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const inputClass = "h-11 rounded-xl";

type AdminFormProps = {
  mode: Mode;
  admin?: Admin;
  isPending: boolean;
  onSubmit: (values: AdminFormValues) => void;
  onCancel: () => void;
};

export function AdminForm({ mode, admin, isPending, onSubmit, onCancel }: AdminFormProps) {
  const schema = useMemo(() => buildSchema(mode), [mode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: admin?.firstName ?? "",
      lastName: admin?.lastName ?? "",
      email: admin?.email ?? "",
      password: "",
      department: admin?.department ?? "",
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
        <h2 className="border-b pb-3 text-lg font-semibold">Work</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Department" htmlFor="department" error={errors.department?.message}>
            <Input
              id="department"
              list="department-suggestions"
              placeholder="e.g. Administration"
              className={inputClass}
              {...register("department")}
            />
            <datalist id="department-suggestions">
              {DEPARTMENT_SUGGESTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </FormField>
        </div>
        {mode === "create" && (
          <p className="text-sm text-muted-foreground">New accounts are created with the Admin role.</p>
        )}
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

export function CreateAdminForm() {
  const router = useRouter();
  const { mutate, isPending } = adminHooks.useCreate();

  return (
    <AdminForm
      mode="create"
      isPending={isPending}
      onSubmit={(v) => mutate({ ...v, password: v.password ?? "" })}
      onCancel={() => router.push(ROUTES.admins)}
    />
  );
}

export function EditAdminForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: admin, isLoading, isError, isPlaceholderData } = adminHooks.useOne(userId);
  const { mutate, isPending } = adminHooks.useUpdate(userId);

  if (isError) return <EntityNotFound noun="admin" backHref={ROUTES.admins} />;
  if (isLoading || isPlaceholderData || !admin) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <AdminForm
      key={admin.id}
      mode="edit"
      admin={admin}
      isPending={isPending}
      onSubmit={(v) => mutate(v)}
      onCancel={() => router.push(ROUTES.adminDetail(userId))}
    />
  );
}