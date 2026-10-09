"use client";

import {
  Megaphone,
  Users,
  User2,
  ShieldUser,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardStat, StatKey } from "../types";

const config = {
  students: { icon: User2, tone: "bg-primary/10 text-primary" },
  teachers: { icon: Users, tone: "bg-success/10 text-success" },
  admins: { icon: ShieldUser, tone: "bg-warning/10 text-warning" },
  notices: { icon: Megaphone, tone: "bg-violet-500/10 text-violet-500" },
} satisfies Record<StatKey, { icon: React.ElementType; tone: string }>;

interface statsGridProps {
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  noticeCount: number;
}

export function StatsGrid({studentCount, teacherCount, adminCount, noticeCount}: statsGridProps) {

  const dashboardStats: DashboardStat[] = [
    { key: "students", label: "Total Students", value: studentCount },
    { key: "teachers", label: "Total Teachers", value: teacherCount },
    { key: "admins", label: "Total Admins", value: adminCount },
    { key: "notices", label: "Total Notices", value: noticeCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => {
        const { icon: Icon, tone } = config[stat.key];

        return (
          <div key={stat.key} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-3 flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
