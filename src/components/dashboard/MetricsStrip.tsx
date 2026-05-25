'use client';

import React, { useMemo } from 'react';
import { Users, DollarSign, Gauge, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';

const HOURS_PER_MONTH = 173;

interface MetricsStripProps {
  employees: Employee[];
}

function formatCurrencyCompact(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function MetricsStrip({ employees }: MetricsStripProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const isActive = (e: Employee) =>
      'status' in e ? (e as { status: string }).status === 'Active' : true;

    const active = employees.filter(isActive);
    let monthlyRevenue = 0;
    let billable = 0;
    let expiringNext30 = 0;

    active.forEach((e) => {
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (isBillable) {
        billable += 1;
        const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
        const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
        const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
        if (typeof pay === 'number' && pay > 0) {
          monthlyRevenue += salaryType === 'Hourly' ? pay * HOURS_PER_MONTH : pay / 12;
        } else if (typeof salary === 'number' && salary > 0) {
          monthlyRevenue += salary;
        }
      }
      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (expiry) {
        const d = new Date(expiry);
        if (!Number.isNaN(d.getTime()) && d >= now && d <= in30) expiringNext30 += 1;
      }
    });

    const utilization = active.length ? Math.round((billable / active.length) * 100) : 0;
    return {
      activeCount: active.length,
      revenue: monthlyRevenue,
      utilization,
      expiringNext30,
    };
  }, [employees]);

  const items = [
    { icon: Users,       label: 'active',       value: metrics.activeCount.toLocaleString(),                tone: 'text-slate-900' },
    { icon: DollarSign,  label: 'run-rate',     value: formatCurrencyCompact(metrics.revenue),              tone: 'text-emerald-700' },
    { icon: Gauge,       label: 'utilization',  value: `${metrics.utilization}%`,                           tone: 'text-indigo-700' },
    { icon: Calendar,    label: 'expire in 30d', value: metrics.expiringNext30.toLocaleString(),             tone: metrics.expiringNext30 > 0 ? 'text-amber-700' : 'text-slate-900' },
  ];

  return (
    <div className="surface flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Metrics</span>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.label}>
            {i > 0 && <span className="h-4 w-px bg-slate-200" />}
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              <span className={cn('font-display text-base font-bold tabular-nums', item.tone)}>{item.value}</span>
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
