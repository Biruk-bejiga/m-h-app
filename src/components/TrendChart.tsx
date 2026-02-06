"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint } from "@/lib/time";

export function TrendChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: ChartPoint[];
}) {
  return (
    <figure className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <figcaption className="mb-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-slate-300">{description}</div>
      </figcaption>

      <div className="h-56" role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(226,232,240,0.8)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <YAxis
              domain={[0, 8]}
              tick={{ fill: "rgba(226,232,240,0.8)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(2,6,23,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "rgba(241,245,249,0.95)",
              }}
              labelStyle={{ color: "rgba(241,245,249,0.95)" }}
            />
            <Line
              type="monotone"
              dataKey="riskScore"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
