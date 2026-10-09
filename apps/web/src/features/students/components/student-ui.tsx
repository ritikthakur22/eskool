import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Student } from "../types";
import { getStudentName } from "../utils";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  DISABLED: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium",
        statusStyles[status] ?? "bg-warning/10 text-warning"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function StudentAvatar({ student, className }: { student: Student; className?: string }) {
  const name = getStudentName(student);

  if (student?.profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={student.profilePictureUrl}
        alt={name}
        className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}