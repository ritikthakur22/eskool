"use client";

import { useState } from "react";

import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { EntityNotFound } from "@/components/shared/entity-not-found";
import { InfoCard } from "@/components/shared/info-card";
import { PersonHeader } from "@/components/shared/person-header";
import { StatusPill } from "@/components/shared/person-ui";
import { StatusDialog } from "@/components/shared/status-dialog";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { teacherHooks } from "../hooks";
import { getTeacherName } from "../utils";
import { SubjectChips } from "./subject-chips";

export function TeacherDetail({ userId }: { userId: string }) {
  const { data: teacher, isLoading, isError } = teacherHooks.useOne(userId);
  const { mutate, isPending } = teacherHooks.useSetStatus();
  const [statusOpen, setStatusOpen] = useState(false);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !teacher) return <EntityNotFound noun="teacher" backHref={ROUTES.teachers} />;

  const name = getTeacherName(teacher);

  return (
    <div className="space-y-6">
      <PersonHeader
        name={name}
        email={teacher.email}
        id={teacher.id}
        status={teacher.status}
        createdAt={teacher.createdAt}
        editHref={ROUTES.teacherEdit(teacher.id)}
        onToggleStatus={() => setStatusOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard
          title="Personal Information"
          rows={[
            ["First name", teacher.firstName],
            ["Last name", teacher.lastName],
          ]}
        />
        <InfoCard
          title="Teaching"
          rows={[
            ["Subjects", <SubjectChips key="subjects" subjects={teacher.subjects} />],
            ["Number of subjects", String(teacher.subjects.length)],
          ]}
        />
        <InfoCard
          title="Account"
          rows={[
            ["Email", teacher.email],
            ["Status", <StatusPill key="status" status={teacher.status} />],
            ["Created", formatDate(teacher.createdAt)],
            ["Last updated", formatDate(teacher.updatedAt)],
            ["Disabled on", teacher.disabledAt ? formatDate(teacher.disabledAt) : null],
          ]}
        />
      </div>

      <StatusDialog
        target={statusOpen ? { id: teacher.id, name, status: teacher.status } : null}
        noun="teacher"
        isPending={isPending}
        onClose={() => setStatusOpen(false)}
        onConfirm={(restoring) =>
          mutate({ id: teacher.id, active: restoring }, { onSuccess: () => setStatusOpen(false) })
        }
      />
    </div>
  );
}