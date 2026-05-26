'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// Vivid, high-contrast but cohesive palette
export const VIZ = {
  brand: '#15847a',
  blue: '#2563eb',
  violet: '#7c3aed',
  teal: '#0d9488',
  pink: '#db2777',
  emerald: '#059669',
  amber: '#d97706',
  sky: '#0284c7',
  rose: '#e11d48',
  slate: '#64748b',
};

export const TYPE_COLOR: Record<string, string> = {
  W2: VIZ.blue,
  Contract: VIZ.violet,
  '1099': VIZ.teal,
  Offshore: VIZ.pink,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label != null && label !== '' && <p className="mb-1 font-display font-bold text-slate-800">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 py-0.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color || p.payload?.color || p.fill }} />
          <span className="font-medium">{p.name}</span>
          <span className="ml-auto pl-3 font-bold tabular-nums text-slate-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const legendStyle = (v: string) => <span className="text-xs text-slate-600">{v}</span>;

export interface DonutDatum { name: string; value: number; color: string }

export function DonutChart({ data, height = 230 }: { data: DonutDatum[]; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={data.length > 1 ? 3 : 0}
            stroke="none"
            animationDuration={700}
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<TooltipBox />} />
          <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={9} formatter={legendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface SeriesDef { key: string; name: string; color: string }

export function CompareBarChart({
  data, xKey, bars, height = 260, stacked = false,
}: { data: Record<string, unknown>[]; xKey: string; bars: SeriesDef[]; height?: number; stacked?: boolean }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceae4" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(16,61,51,0.04)' }} />
          {bars.length > 1 && <Legend iconType="circle" iconSize={9} formatter={legendStyle} />}
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.color}
              stackId={stacked ? 'a' : undefined}
              radius={stacked ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              maxBarSize={46}
              animationDuration={700}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendAreaChart({
  data, xKey, areas, height = 250,
}: { data: Record<string, unknown>[]; xKey: string; areas: SeriesDef[]; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {areas.map((a) => (
              <linearGradient key={a.key} id={`grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={a.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={a.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceae4" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
          <Tooltip content={<TooltipBox />} />
          {areas.length > 1 && <Legend iconType="circle" iconSize={9} formatter={legendStyle} />}
          {areas.map((a) => (
            <Area
              key={a.key}
              type="monotone"
              dataKey={a.key}
              name={a.name}
              stroke={a.color}
              strokeWidth={2.5}
              fill={`url(#grad-${a.key})`}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={800}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
