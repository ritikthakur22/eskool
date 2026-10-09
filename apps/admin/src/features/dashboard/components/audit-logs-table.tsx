"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { useAuditLogs } from "../hooks";
import { AuditLog } from "../types";
// import { auditLogs } from "../mock-data";

const actionStyles: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-warning/10 text-warning",
  LOGOUT: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogsTable() {
  const { data, isPending, isError } = useAuditLogs({
    limit: 10,
    offset: 0,
  });

  const auditLogs = data?.items ?? [];

  if (isPending) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold">Audit Logs</h3>
        <p className="text-sm text-muted-foreground">
          Loading audit logs...
        </p>
      </div>
    );
  }

   if (isError) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold">Audit Logs</h3>
        <p className="text-sm text-destructive">
          Failed to load audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audit Logs</h3>
        <Link
          href={ROUTES.auditLogs}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 rounded-xl px-4",
          )}
        >
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.map((log: AuditLog) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {log.user ? initials(log.user.email) : "SY"}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">
                      {log.user?.name ?? "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user?.email ?? "—"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    actionStyles[log.action] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {log.action}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-sm">{log.entity}</p>
                <p className="text-xs text-muted-foreground">
                  #{log.entityId ?? "—"}
                </p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.ipAddress ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                {formatDate(log.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
