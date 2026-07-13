"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export interface TimelinePoint {
  date: string;
  actual: number | null;
  theorique: number;
}

export interface TimelineMarker {
  date: string;
  label: string;
}

export function TimelineChart({
  data,
  markers,
}: {
  data: TimelinePoint[];
  markers: TimelineMarker[];
}) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 24, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            stroke="var(--color-plum-100)"
            strokeDasharray="2 6"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(iso: string) => {
              const [, month, day] = iso.split("-");
              return `${day}.${month}`;
            }}
            tick={{ fontSize: 11, fill: "var(--color-plum-700)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-plum-200)" }}
            interval="preserveStartEnd"
            minTickGap={42}
          />
          <YAxis
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 11, fill: "var(--color-plum-700)" }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            width={48}
            domain={[0, 1]}
          />
          {markers.map((m) => (
            <ReferenceLine
              key={m.date + m.label}
              x={m.date}
              stroke="var(--color-ciel-300)"
              strokeDasharray="3 3"
            />
          ))}
          <Line
            type="stepAfter"
            dataKey="theorique"
            stroke="var(--color-ciel-600)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="actual"
            stroke="var(--color-petale-500)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
