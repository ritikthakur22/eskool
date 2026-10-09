import { AuditLogsTable } from "@/features/dashboard/components/audit-logs-table";
import { OverviewChart } from "@/features/dashboard/components/overview-chart";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { StudentAnalysisChart } from "@/features/dashboard/components/student-analysis-chart";
import { Welcome } from "@/features/dashboard/components/welcome";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Welcome />
      <StatsGrid />
      <div className="grid gap-4 xl:grid-cols-2">
        <OverviewChart />
        <StudentAnalysisChart />
      </div>
      <AuditLogsTable />
    </div>
  );
}