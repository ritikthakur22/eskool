import Link from "next/link";
import { Eye, Pencil, RotateCcw, Ban } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { formatClass, getStudentName } from "../utils";
import { StatusPill, StudentAvatar } from "./student-ui";
import { cn } from "@/lib/utils";
import type { Student } from "../types";

type StudentsTableProps = {
  students: Student[];
  isLoading: boolean;
  isError: boolean;
  onToggleStatus: (student: Student) => void;
};

const COLUMNS = 7;
const actionBase = "flex h-8 w-8 items-center justify-center rounded-lg transition-colors";

export function StudentsTable({ students, isLoading, isError, onToggleStatus }: StudentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Roll No</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: COLUMNS }).map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 w-full max-w-30 animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {!isLoading && isError && (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="py-10 text-center text-muted-foreground">
              Failed to load students.
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !isError && students.length === 0 && (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="py-10 text-center text-muted-foreground">
              No students found.
            </TableCell>
          </TableRow>
        )}

        {students.map((student) => {
          const disabled = student.status === "DISABLED";
          return (
            <TableRow key={student.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <StudentAvatar student={student} />
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{getStudentName(student)}</p>
                    {/* <p className="text-xs text-muted-foreground">#{student.userId ?? student.id.slice(0, 8)}</p> */}
                    <p className="text-xs text-muted-foreground">#{student.id.slice(0, 8)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
              <TableCell className="text-sm">{formatClass(student.profile)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm">{student.profile.rollNo ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(student.createdAt)}
              </TableCell>
              <TableCell>
                <StatusPill status={student.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={ROUTES.studentDetail(student.id)}
                    title="View"
                    aria-label="View student"
                    className={cn(actionBase, "bg-primary/10 text-primary hover:bg-primary/20")}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={ROUTES.studentEdit(student.id)}
                    title="Edit"
                    aria-label="Edit student"
                    className={cn(actionBase, "bg-success/10 text-success hover:bg-success/20")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    title={disabled ? "Restore" : "Disable"}
                    aria-label={disabled ? "Restore student" : "Disable student"}
                    onClick={() => onToggleStatus(student)}
                    className={cn(
                      actionBase,
                      disabled
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20",
                    )}
                  >
                    {disabled ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}