import { cn } from "@/lib/utils";
import type { AuditLog } from "@/features/dashboard/types";

const ACTION_STYLES: Array<[RegExp, string]> = [
  [/DELETE|DISABLE|REVOKE|FAIL/, "bg-destructive/10 text-destructive"],
  [/CREATE|RESTORE|ADD/, "bg-success/10 text-success"],
  [/UPDATE|CHANGE|EDIT/, "bg-primary/10 text-primary"],
  [/LOGIN|LOGOUT|PASSWORD/, "bg-warning/10 text-warning"],
];

export function getActionStyle(action: string) {
  const key = action.toUpperCase();
  return ACTION_STYLES.find(([re]) => re.test(key))?.[1] ?? "bg-muted text-muted-foreground";
}

export function getInitials(log: AuditLog) {
  const source = log.user?.firstName?.trim() || log.user?.email;
  if (!source) return "SY";
  const base = source.includes("@") ? source.split("@")[0] : source;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : base.slice(0, 2)).toUpperCase();
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

export function ActionBadge({ action }: { action: string }) {
  return (
    <span className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium", getActionStyle(action))}>
      {formatAction(action)}
    </span>
  );
}

export function AuditLogUserCell({ log }: { log: AuditLog }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(log)}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-medium">{log.user?.firstName ?? (log.user ? log.user.role : "System")}</p>
        <p className="truncate text-xs text-muted-foreground">{log.user?.email ?? "—"}</p>
      </div>
    </div>
  );
}