import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import { formatDate, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Student } from "../types";

type StudentsTableProps = {
  students: Student[];
  isLoading: boolean;
  isError: boolean;
  onDelete: (student: Student) => void;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  DISABLED: "bg-destructive/10 text-destructive",
};

const actionBase = "flex h-8 w-8 items-center justify-center rounded-lg transition-colors";

function StatusPill({ status }: { status: string }) {
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

function Avatar({ student }: { student: Student }) {
  if (student.profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={student.profilePictureUrl}
        alt={student.profile.fullName}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {getInitials(student.profile.fullName)}
    </span>
  );
}

export function StudentsTable({ students, isLoading, isError, onDelete }: StudentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 w-full max-w-30 animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {!isLoading && isError && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
              Failed to load students.
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !isError && students.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
              No students found.
            </TableCell>
          </TableRow>
        )}

        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar student={student} />
                <div className="leading-tight">
                  <p className="text-sm font-medium">{student.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground">#{student.id.slice(0, 8)}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
            <TableCell className="text-sm">{student.profile.className ?? "—"}</TableCell>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDate(student.createdAt)}
            </TableCell>
            <TableCell>
              <StatusPill status={student.status} />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`${ROUTES.students}/${student.id}`}
                  title="View"
                  aria-label="View student"
                  className={cn(actionBase, "bg-primary/10 text-primary hover:bg-primary/20")}
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`${ROUTES.students}/${student.id}/edit`}
                  title="Edit"
                  aria-label="Edit student"
                  className={cn(actionBase, "bg-success/10 text-success hover:bg-success/20")}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  title="Delete"
                  aria-label="Delete student"
                  onClick={() => onDelete(student)}
                  className={cn(actionBase, "bg-destructive/10 text-destructive hover:bg-destructive/20")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}