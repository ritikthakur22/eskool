import { PageHeader } from "@/components/shared/page-header";
import { AuditLogsList } from "@/features/auditLogs/compnents/audit-logs-list";

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader title="Audit Logs" description="Track every action taken in your school" />
      <AuditLogsList />
    </>
  );
}