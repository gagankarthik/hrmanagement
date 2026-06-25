'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LabelList,
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
          <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(29,78,216,0.04)' }} />
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

/** Horizontal bar chart — ideal for ranked lists (top clients, utilization by class). */
export function HBarChart({
  data, categoryKey, valueKey, height = 260, color = VIZ.brand, money = false, suffix = '', onBarClick,
}: {
  data: Record<string, unknown>[];
  categoryKey: string;
  valueKey: string;
  height?: number;
  color?: string;
  money?: boolean;
  suffix?: string;
  onBarClick?: (row: Record<string, unknown>) => void;
}) {
  const fmt = (v: number) => (money ? `$${Math.round(v).toLocaleString()}` : `${v}${suffix}`);
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 52, left: 8, bottom: 4 }} barCategoryGap={12}>
          <CartesianGrid horizontal={false} stroke="#eceae4" strokeDasharray="3 3" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey={categoryKey} width={120} tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(29,78,216,0.04)' }} />
          <Bar
            dataKey={valueKey}
            radius={[0, 6, 6, 0]}
            maxBarSize={26}
            animationDuration={700}
            cursor={onBarClick ? 'pointer' : 'default'}
            onClick={onBarClick ? (d: any) => onBarClick(d?.payload ?? d) : undefined}
          >
            {data.map((d, i) => <Cell key={i} fill={(d.color as string) || color} />)}
            <LabelList dataKey={valueKey} position="right" formatter={fmt as any} style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} />
          </Bar>
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

/**
 * FunnelChart — dependency-free progression funnel rendered as horizontal
 * stage bars. Each stage's width is proportional to the first (top) stage, and
 * each row shows the value plus its conversion vs the top stage. Ideal for
 * Timesheet→Invoice→Paid billing flow and the I-9 verification pipeline.
 */
export interface FunnelStage { label: string; value: number; color?: string }

export function FunnelChart({
  stages, format, showStepConversion = true,
}: {
  stages: FunnelStage[];
  format?: (v: number) => string;
  showStepConversion?: boolean;
}) {
  const fmt = format ?? ((v: number) => v.toLocaleString());
  const top = stages.length ? Math.max(stages[0].value, 1) : 1;
  const palette = [VIZ.brand, VIZ.teal, VIZ.sky, VIZ.violet, VIZ.slate];
  return (
    <div className="flex flex-col gap-3">
      {stages.map((s, i) => {
        const widthPct = Math.max(2, Math.min(100, (s.value / top) * 100));
        const ofTop = stages[0]?.value ? (s.value / stages[0].value) * 100 : 0;
        const ofPrev = i === 0 || !stages[i - 1].value ? 100 : (s.value / stages[i - 1].value) * 100;
        const color = s.color || palette[i % palette.length];
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="tnum font-semibold text-slate-900">
                {fmt(s.value)}
                {i > 0 && <span className="ml-1.5 font-normal text-slate-400">{ofTop.toFixed(0)}%</span>}
              </span>
            </div>
            <div className="relative h-7 overflow-hidden rounded-lg bg-slate-100">
              <div
                className="flex h-full items-center rounded-lg transition-all"
                style={{ width: `${widthPct}%`, background: color, minWidth: '2%' }}
              />
              {showStepConversion && i > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                  ↓ {ofPrev.toFixed(0)}% of prev
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
