"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTick, gridStroke, tooltipProps } from "../chart-theme";
import { weeklyActivity } from "../mock-data";

const series = [
  { key: "teachers", label: "Teachers", opacity: 1 },
  { key: "students", label: "Students", opacity: 0.6 },
  { key: "admins", label: "Admins", opacity: 0.3 },
] as const;

export function OverviewChart() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Weekly Activity</h3>
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            +23.5%
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" style={{ opacity: s.opacity }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyActivity} barSize={28}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} width={32} tick={axisTick} />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} {...tooltipProps} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="activity"
                fill="var(--primary)"
                fillOpacity={s.opacity}
                radius={i === series.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}