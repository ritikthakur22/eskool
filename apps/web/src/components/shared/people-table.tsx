import Link from "next/link";
import { Ban, Eye, Pencil, RotateCcw } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";
import { PersonAvatar, StatusPill } from "./person-ui";

export type Column<T> = { header: string; cell: (row: T) => React.ReactNode };

type PeopleTableProps<T extends Person> = {
  rows: T[];
  extraColumns: Column<T>[];
  nameOf: (row: T) => string;
  noun: string;
  isLoading: boolean;
  isError: boolean;
  detailHref: (id: string) => string;
  editHref: (id: string) => string;
  onToggleStatus: (row: T) => void;
  onPrefetch: (id: string) => void;
};

const actionBase = "flex h-8 w-8 items-center justify-center rounded-lg transition-colors";

export function PeopleTable<T extends Person>({
  rows,
  extraColumns,
  nameOf,
  noun,
  isLoading,
  isError,
  detailHref,
  editHref,
  onToggleStatus,
  onPrefetch,
}: PeopleTableProps<T>) {
  const columnCount = 5 + extraColumns.length; // name, email, joined, status, action + extras

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="capitalize">{noun}</TableHead>
          <TableHead>Email</TableHead>
          {extraColumns.map((c) => (
            <TableHead key={c.header}>{c.header}</TableHead>
          ))}
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {!isLoading && isError && (
          <TableRow>
            <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">
              Failed to load {noun}s.
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">
              No {noun}s found.
            </TableCell>
          </TableRow>
        )}

        {rows.map((row) => {
          const name = nameOf(row);
          const disabled = row.status === "DISABLED";

          return (
            <TableRow key={row.id} onMouseEnter={() => onPrefetch(row.id)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <PersonAvatar name={name} />
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">#{row.id.slice(0, 8)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
              {extraColumns.map((c) => (
                <TableCell key={c.header} className="text-sm">
                  {c.cell(row)}
                </TableCell>
              ))}
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(row.createdAt)}
              </TableCell>
              <TableCell>
                <StatusPill status={row.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={detailHref(row.id)}
                    title="View"
                    aria-label={`View ${noun}`}
                    className={cn(actionBase, "bg-primary/10 text-primary hover:bg-primary/20")}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={editHref(row.id)}
                    title="Edit"
                    aria-label={`Edit ${noun}`}
                    className={cn(actionBase, "bg-success/10 text-success hover:bg-success/20")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    title={disabled ? "Restore" : "Disable"}
                    aria-label={disabled ? `Restore ${noun}` : `Disable ${noun}`}
                    onClick={() => onToggleStatus(row)}
                    className={cn(
                      actionBase,
                      disabled
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
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