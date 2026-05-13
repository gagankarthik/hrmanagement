'use client';

import React, { useMemo } from 'react';
import { Shield, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';

interface WorkforceInsightsProps {
  employees: Employee[];
}

function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}

export default function WorkforceInsights({ employees }: WorkforceInsightsProps) {
  const data = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in60 = new Date(now.getTime() + 60 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);

    // Auth expiry buckets (active only)
    let expired = 0, b30 = 0, b60 = 0, b90 = 0, beyond = 0;

    // Hiring trend (24 weeks)
    const weeks = 24;
    const start = new Date(now.getTime() - weeks * 7 * 86400000);
    const trend: number[] = Array(weeks).fill(0);

    // Tenure buckets
    const tenure: Record<string, number> = { '<1y': 0, '1–3y': 0, '3–5y': 0, '5–10y': 0, '10y+': 0 };

    employees.forEach((e) => {
      if (isActive(e)) {
        const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
        if (expiry) {
          const d = new Date(expiry);
          if (!Number.isNaN(d.getTime())) {
            if (d < now) expired += 1;
            else if (d <= in30) b30 += 1;
            else if (d <= in60) b60 += 1;
            else if (d <= in90) b90 += 1;
            else beyond += 1;
          }
        }
      }

      if (e.hireDate) {
        const h = new Date(e.hireDate);
        if (!Number.isNaN(h.getTime())) {
          if (h >= start && h <= now) {
            const idx = Math.min(weeks - 1, Math.floor((h.getTime() - start.getTime()) / (7 * 86400000)));
            trend[idx] += 1;
          }
          const yrs = (now.getTime() - h.getTime()) / (365 * 86400000);
          if (yrs >= 0) {
            if (yrs < 1) tenure['<1y'] += 1;
            else if (yrs < 3) tenure['1–3y'] += 1;
            else if (yrs < 5) tenure['3–5y'] += 1;
            else if (yrs < 10) tenure['5–10y'] += 1;
            else tenure['10y+'] += 1;
          }
        }
      }
    });

    const trendTotal = trend.reduce((s, n) => s + n, 0);
    const firstHalf = trend.slice(0, Math.floor(weeks / 2)).reduce((s, n) => s + n, 0);
    const secondHalf = trend.slice(Math.floor(weeks / 2)).reduce((s, n) => s + n, 0);
    const trendDelta = firstHalf ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    return {
      expiry: { expired, b30, b60, b90, beyond },
      trend, trendTotal, trendDelta,
      tenure,
    };
  }, [employees]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ExpiryCard data={data.expiry} />
      <HiringTrendCard data={data.trend} total={data.trendTotal} delta={data.trendDelta} />
      <TenureCard data={data.tenure} />
    </div>
  );
}

function ExpiryCard({ data }: { data: { expired: number; b30: number; b60: number; b90: number; beyond: number } }) {
  const buckets = [
    { label: 'Expired',  value: data.expired, color: '#ef4444' },
    { label: '0–30d',    value: data.b30,     color: '#f59e0b' },
    { label: '31–60d',   value: data.b60,     color: '#eab308' },
    { label: '61–90d',   value: data.b90,     color: '#0ea5e9' },
    { label: '90+d',     value: data.beyond,  color: '#94a3b8' },
  ];
  const max = Math.max(...buckets.map((b) => b.value), 1);
  const total = buckets.reduce((s, b) => s + b.value, 0);
  const urgent = data.expired + data.b30;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
            <Shield className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Auth Expiry</h3>
            <p className="text-[11px] text-slate-500">Next 90 days, active workforce</p>
          </div>
        </div>
        {urgent > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
            {urgent} urgent
          </span>
        )}
      </header>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No authorization data</p>
      ) : (
        <>
          <div className="flex h-24 items-end gap-1.5">
            {buckets.map((b) => {
              const h = (b.value / max) * 100;
              return (
                <div key={b.label} className="group flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-bold tabular-nums text-slate-700 opacity-0 transition-opacity group-hover:opacity-100">{b.value}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${h}%`, backgroundColor: b.color, minHeight: b.value > 0 ? 6 : 0 }}
                    title={`${b.label}: ${b.value}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-slate-500">
            {buckets.map((b) => (
              <span key={b.label} className="flex-1 truncate text-center" title={`${b.label}: ${b.value}`}>
                {b.label}
              </span>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

function HiringTrendCard({ data, total, delta }: { data: number[]; total: number; delta: number }) {
  const w = 420, h = 96, pad = 6;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : w - pad * 2;
  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y, v, i] as const;
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = points.length
    ? `${line} L ${points[points.length - 1][0]} ${h - pad} L ${pad} ${h - pad} Z`
    : '';

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Hiring Trend</h3>
            <p className="text-[11px] text-slate-500">Last 24 weeks · {total} hire{total === 1 ? '' : 's'}</p>
          </div>
        </div>
        {total > 0 && delta !== 0 && (
          <span className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}>
            {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </header>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No hiring activity in 24 weeks</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" height={96}>
          <defs>
            <linearGradient id="dashHireGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#dashHireGrad)" />
          <path d={line} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y, v, i]) => v > 0 && (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#6366f1">
              <title>{`Week ${i + 1}: ${v} hire${v === 1 ? '' : 's'}`}</title>
            </circle>
          ))}
        </svg>
      )}
    </article>
  );
}

function TenureCard({ data }: { data: Record<string, number> }) {
  const buckets = Object.entries(data).map(([label, value]) => ({ label, value }));
  const total = buckets.reduce((s, b) => s + b.value, 0);
  const max = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tenure</h3>
            <p className="text-[11px] text-slate-500">Years with the company</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-slate-500">{total}</span>
      </header>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No hire-date data</p>
      ) : (
        <ul className="space-y-2">
          {buckets.map((b) => {
            const pct = total ? Math.round((b.value / total) * 100) : 0;
            return (
              <li key={b.label} title={`${b.label}: ${b.value} (${pct}%)`}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-700">{b.label}</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {b.value}<span className="ml-1 text-slate-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(b.value / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
