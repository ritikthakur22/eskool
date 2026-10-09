export type StatKey = "students" | "teachers" | "admins" | "notices";

export type DashboardStat = {
  key: StatKey;
  label: string;
  value: number;
};

// Mirrors the Prisma AuditLog model (+ the joined user)
export type AuditLog = {
  id: string;
  schoolId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string; // ISO date
  user: { name: string; email: string } | null;
};