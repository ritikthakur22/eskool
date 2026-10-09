export type StatKey = "students" | "teachers" | "admins" | "notices";

export type DashboardStat = {
  key: StatKey;
  label: string;
  value: number;
};

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
  user: {
    email: string;
    role: string;
    name?: string;
  } | null;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  hasMore: boolean;
  nextOffset: number | null;
}

export interface AuditLogParams {
  limit?: number;
  offset?: number;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
}