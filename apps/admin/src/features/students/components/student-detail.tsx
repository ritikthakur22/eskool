"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Pencil, RotateCcw } from "lucide-react";

import { InfoCard } from "@/components/shared/info-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStudent } from "../hooks";
import { getStudentName } from "../utils";
import { StudentNotFound } from "./student-not-found";
import { StudentStatusDialog } from "./student-status-dialog";
import { StatusPill, StudentAvatar } from "./student-ui";

export function StudentDetail({ userId }: { userId: string }) {
  const { data: student, isLoading, isError } = useStudent(userId);
  const [statusOpen, setStatusOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !student) return <StudentNotFound />;

  const { profile } = student;
  const disabled = student.status === "DISABLED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <StudentAvatar student={student} className="h-24 w-24 text-2xl" />

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{getStudentName(student)}</h2>
            <StatusPill status={student.status} />
          </div>
          <p className="text-sm text-muted-foreground">{student.email}</p>
          <p className="text-xs text-muted-foreground">
            ID #{student.id} · Joined {formatDate(student.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={ROUTES.studentEdit(student.id)} className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
          <Button
            variant={disabled ? "secondary" : "destructive"}
            className="h-10 rounded-xl px-4"
            onClick={() => setStatusOpen(true)}
          >
            {disabled ? <RotateCcw className="mr-1.5 h-4 w-4" /> : <Ban className="mr-1.5 h-4 w-4" />}
            {disabled ? "Restore" : "Disable"}
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard
          title="Personal Information"
          rows={[
            ["First name", profile.firstName],
            ["Last name", profile.lastName],
            ["Gender", profile.gender],
            ["Date of birth", profile.dob ? formatDate(profile.dob) : null],
            ["Phone", profile.phone],
            ["Address", profile.address],
          ]}
        />

        <InfoCard
          title="Academic Information"
          rows={[
            ["Grade", profile.grade],
            ["Section", profile.section],
            ["Roll number", profile.rollNo],
          ]}
        />

        <InfoCard
          title="Guardian"
          rows={[
            ["Name", profile.parentName],
            ["Phone", profile.parentPhone],
          ]}
        />

        <InfoCard
          title="Account"
          rows={[
            ["Email", student.email],
            ["Status", <StatusPill key="status" status={student.status} />],
            ["Created", formatDate(student.createdAt)],
            ["Last updated", student.updatedAt ? formatDate(student.updatedAt) : null],
            ["Disabled on", student.disabledAt ? formatDate(student.disabledAt) : null],
          ]}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Gender, date of birth, phone, address and guardian details are managed by the student from
        their own profile.
      </p>

      <StudentStatusDialog student={statusOpen ? student : null} onClose={() => setStatusOpen(false)} />
    </div>
  );
}