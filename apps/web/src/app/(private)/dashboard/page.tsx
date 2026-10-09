"use client"

import { AuditLogsTable } from "@/features/dashboard/components/audit-logs-table";
import { OverviewChart } from "@/features/dashboard/components/overview-chart";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { StudentAnalysisChart } from "@/features/dashboard/components/student-analysis-chart";
import { Welcome } from "@/features/dashboard/components/welcome";
import { useNoticeCounts, useUserCounts } from "@/features/dashboard/hooks";

export default function DashboardPage() {

    const userCount = useUserCounts();
    const noticeCount = useNoticeCounts();
    const {
      adminCount = 0,
      studentCount = 0,
      teacherCount = 0,
    } = userCount?.data ?? {};
    const nC = noticeCount?.data?.totalNotices ?? 0;
  

  return (
    <div className="space-y-6">
      <Welcome />
      <StatsGrid studentCount={studentCount} adminCount={adminCount} teacherCount={teacherCount} noticeCount={nC}/>
      <div className="grid gap-4 xl:grid-cols-2">
        <OverviewChart />
        <StudentAnalysisChart />
      </div>
      <AuditLogsTable />
    </div>
  );
}