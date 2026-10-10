import { AuditLogParams } from "@/features/dashboard/types";

export type AuditLogFilters = Omit<AuditLogParams, "offset">;

export const auditLogsKeys = {
  all: ["all-dashboard"],
  auditLogsInfinite: (filters?: AuditLogFilters) => [...auditLogsKeys.all, "audit-logs-infinite", filters],
};