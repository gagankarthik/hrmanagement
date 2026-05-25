'use client';

import React, { useMemo } from 'react';
import { Users, UserPlus, Gauge, CalendarClock } from 'lucide-react';
import { Employee } from '@/types/employee';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

interface MetricsStripProps {
  employees: Employee[];
}

export default function MetricsStrip({ employees }: MetricsStripProps) {
  const m = useMemo(() => {
    const now = new Date();
    const isActive = (e: Employee) =>
      'status' in e ? (e as { status: string }).status === 'Active' : true;

    const active = employees.filter(isActive);

    const billable = active.filter(
      (e) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B'
    ).length;
    const utilization = active.length ? Math.round((billable / active.length) * 100) : 0;

    const in30 = new Date(now.getTime() + 30 * 86400000);
    const expiring = active.filter((e) => {
      const ed = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!ed) return false;
      const d = new Date(ed);
      return !Number.isNaN(d.getTime()) && d >= now && d <= in30;
    }).length;

    // 8-month series: cumulative headcount + new hires per month (derived from hireDate)
    const cum: number[] = [];
    const hires: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      cum.push(employees.filter((e) => e.hireDate && new Date(e.hireDate) < monthEnd).length);
      hires.push(
        employees.filter((e) => {
          if (!e.hireDate) return false;
          const d = new Date(e.hireDate);
          return d >= monthStart && d < monthEnd;
        }).length
      );
    }

    const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

    return {
      activeCount: active.length,
      utilization,
      expiring,
      cum,
      hires,
      hiresThisMonth: hires[hires.length - 1],
      headcountTrend: pct(cum[cum.length - 1], cum[cum.length - 2] || 0),
      hiresTrend: pct(hires[hires.length - 1], hires[hires.length - 2] || 0),
    };
  }, [employees]);

  return (
    <StatGrid cols={4}>
      <StatCard
        label="Active employees"
        value={m.activeCount}
        icon={Users}
        tone="emerald"
        spark={m.cum}
        trend={{ value: `${Math.abs(m.headcountTrend)}%`, up: m.headcountTrend >= 0 }}
        hint="currently active"
      />
      <StatCard
        label="New hires"
        value={m.hiresThisMonth}
        icon={UserPlus}
        tone="brand"
        spark={m.hires}
        trend={{ value: `${Math.abs(m.hiresTrend)}%`, up: m.hiresTrend >= 0 }}
        hint="this month"
      />
      <StatCard
        label="Utilization"
        value={`${m.utilization}%`}
        icon={Gauge}
        tone="sky"
        hint="billable of active"
      />
      <StatCard
        label="Expiring soon"
        value={m.expiring}
        icon={CalendarClock}
        tone="amber"
        hint="work auths · next 30 days"
      />
    </StatGrid>
  );
}
