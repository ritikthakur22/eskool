"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTick, gridStroke, tooltipProps } from "../chart-theme";
import { studentEnrollment } from "../mock-data";

export function StudentAnalysisChart() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Student Enrollment</h3>
        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          -3.5%
        </span>
      </div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={studentEnrollment}>
            <defs>
              <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} width={32} tick={axisTick} />
            <Tooltip cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }} {...tooltipProps} />
            <Area
              type="monotone"
              dataKey="students"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#enrollFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}