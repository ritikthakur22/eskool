"use client";

import { Megaphone, ShieldCheck, TrendingDown, TrendingUp, Users, GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardStats } from "../mock-data";
import type { StatKey } from "../types";

const config = {
  students: { icon: GraduationCap, tone: "bg-primary/10 text-primary" },
  teachers: { icon: Users, tone: "bg-success/10 text-success" },
  admins: { icon: ShieldCheck, tone: "bg-warning/10 text-warning" },
  notices: { icon: Megaphone, tone: "bg-violet-500/10 text-violet-500" },
} satisfies Record<StatKey, { icon: React.ElementType; tone: string }>;

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => {
        const { icon: Icon, tone } = config[stat.key];

        return (
          <div key={stat.key} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}