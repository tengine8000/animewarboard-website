"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

type DataPoint = { day: string; value: number };

type Props = {
  data:    DataPoint[];
  color:   string;
  label:   string;
  total:   number;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      padding: "6px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
    }}>
      <p style={{ color: "var(--color-text-ghost)", marginBottom: 2 }}>{label}</p>
      <p style={{ color: payload[0].color }}>{payload[0].value}</p>
    </div>
  );
}

export function TrendChart({ data, color, label, total }: Props) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          {label}
        </p>
        <p className="text-2xl font-black" style={{ color }}>{total.toLocaleString()}</p>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 8, fill: "var(--color-text-ghost)", fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 8, fill: "var(--color-text-ghost)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${label})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
