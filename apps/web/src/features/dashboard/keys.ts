import { AuditLogParams } from "./types";

export const dashboardKeys = {
    all: ["all-dashboard"],
    auditLogs: (params?: AuditLogParams) => [...dashboardKeys.all, "audit-logs", params],
    userCount: () => [...dashboardKeys.all, "user-count"],
    noticeCount: () => [...dashboardKeys.all, "notice-count"]
}