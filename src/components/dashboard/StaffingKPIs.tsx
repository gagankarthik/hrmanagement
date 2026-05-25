'use client';

import React, { useMemo } from 'react';
import {
  DollarSign,
  Gauge,
  AlertTriangle,
  UserMinus,
  TimerReset,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';
import { Employee } from '@/types/employee';

// Hours-per-month assumption for converting hourly pay to monthly run-rate (40h/week × 4.33 weeks).
const HOURS_PER_MONTH = 173;

interface StaffingKPIsProps {
  employees: Employee[];
}

function formatCompactCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function isActive(emp: Employee): boolean {
  return 'status' in emp ? (emp as { status: string }).status === 'Active' : true;
}

function hasActiveClientAssignment(emp: Employee): boolean {
  if (emp.clientAssignments?.length) {
    return emp.clientAssignments.some(
      (a) => a.clientId && (!a.endDate || new Date(a.endDate) >= new Date())
    );
  }
  return Boolean(emp.clientId || emp.client);
}

export default function StaffingKPIs({ employees }: StaffingKPIsProps) {
  const kpis = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in60 = new Date(now.getTime() + 60 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);
    const last7 = new Date(now.getTime() - 7 * 86400000);

    const active = employees.filter(isActive);

    // Monthly billable run-rate
    let monthlyRevenue = 0;
    let billableActive = 0;
    active.forEach((e) => {
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (!isBillable) return;
      billableActive += 1;
      const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
      const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
      const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
      if (typeof pay === 'number' && pay > 0) {
        monthlyRevenue += salaryType === 'Hourly' ? pay * HOURS_PER_MONTH : pay / 12;
      } else if (typeof salary === 'number' && salary > 0) {
        monthlyRevenue += salary;
      }
    });

    // Utilization
    const utilization = active.length ? (billableActive / active.length) * 100 : 0;

    // Expiry risk buckets
    const expiringByBucket = { d30: 0, d60: 0, d90: 0, expired: 0 };
    active.forEach((e) => {
      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!expiry) return;
      const d = new Date(expiry);
      if (Number.isNaN(d.getTime())) return;
      if (d < now) expiringByBucket.expired += 1;
      else if (d <= in30) expiringByBucket.d30 += 1;
      else if (d <= in60) expiringByBucket.d60 += 1;
      else if (d <= in90) expiringByBucket.d90 += 1;
    });
    const expiryRisk = expiringByBucket.d30 + expiringByBucket.expired;

    // Bench: active but no active client assignment, OR explicitly non-billable
    const bench = active.filter((e) => {
      if (!hasActiveClientAssignment(e)) return true;
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      return !isBillable;
    }).length;

    // Average time-to-onboard (createdAt → hireDate). Skip when missing or hire predates record.
    const onboardDays: number[] = [];
    employees.forEach((e) => {
      if (!e.hireDate || !e.createdAt) return;
      const c = new Date(e.createdAt);
      const h = new Date(e.hireDate);
      if (Number.isNaN(c.getTime()) || Number.isNaN(h.getTime())) return;
      const days = daysBetween(c, h);
      if (days >= 0 && days <= 180) onboardDays.push(days);
    });
    const avgTimeToOnboard = onboardDays.length
      ? Math.round(onboardDays.reduce((s, n) => s + n, 0) / onboardDays.length)
      : null;

    // 24-week hire trend
    const trendWeeks = 24;
    const hireTrend: number[] = Array(trendWeeks).fill(0);
    const weekMs = 7 * 86400000;
    const trendStart = new Date(now.getTime() - trendWeeks * weekMs);
    employees.forEach((e) => {
      if (!e.hireDate) return;
      const h = new Date(e.hireDate);
      if (Number.isNaN(h.getTime()) || h < trendStart || h > now) return;
      const idx = Math.min(trendWeeks - 1, Math.floor((h.getTime() - trendStart.getTime()) / weekMs));
      hireTrend[idx] += 1;
    });
    const last7Days = employees.filter((e) => {
      if (!e.hireDate) return false;
      const h = new Date(e.hireDate);
      return !Number.isNaN(h.getTime()) && h >= last7 && h <= now;
    }).length;

    const firstHalf = hireTrend.slice(0, Math.floor(trendWeeks / 2)).reduce((s, n) => s + n, 0);
    const secondHalf = hireTrend.slice(Math.floor(trendWeeks / 2)).reduce((s, n) => s + n, 0);
    const trendDelta = firstHalf ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    return {
      monthlyRevenue,
      billableActive,
      utilization,
      expiryRisk,
      expiringByBucket,
      bench,
      avgTimeToOnboard,
      hireTrend,
      last7Days,
      trendDelta,
      activeTotal: active.length,
    };
  }, [employees]);

  const insights = useMemo(() => {
    const out: { tone: 'amber' | 'red' | 'brand' | 'emerald'; icon: React.ElementType; text: string }[] = [];
    if (kpis.expiringByBucket.expired > 0) {
      out.push({
        tone: 'red',
        icon: AlertTriangle,
        text: `${kpis.expiringByBucket.expired} work authorization${kpis.expiringByBucket.expired === 1 ? '' : 's'} already expired — renew immediately`,
      });
    }
    if (kpis.expiringByBucket.d30 > 0) {
      out.push({
        tone: 'amber',
        icon: CalendarClock,
        text: `${kpis.expiringByBucket.d30} contract${kpis.expiringByBucket.d30 === 1 ? '' : 's'} expire in the next 30 days`,
      });
    }
    if (kpis.last7Days > 0) {
      out.push({
        tone: 'emerald',
        icon: TrendingUp,
        text: `${kpis.last7Days} new hire${kpis.last7Days === 1 ? '' : 's'} in the last 7 days`,
      });
    }
    if (kpis.bench >= 5) {
      out.push({
        tone: 'brand',
        icon: Info,
        text: `${kpis.bench} active employees on bench — review assignments`,
      });
    }
    if (out.length === 0) {
      out.push({
        tone: 'brand',
        icon: Sparkles,
        text: 'No alerts — staffing operations are running smoothly',
      });
    }
    return out.slice(0, 4);
  }, [kpis]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staffing KPIs</h2>
          <p className="mt-0.5 text-xs text-slate-500">Live metrics derived from your active workforce</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Monthly billable revenue */}
        <KPICard
          label="Billable Run-Rate"
          value={formatCompactCurrency(kpis.monthlyRevenue)}
          icon={DollarSign}
          tone="emerald"
          subtitle={`${kpis.billableActive} billable active`}
        />

        {/* Utilization */}
        <KPICard
          label="Utilization"
          value={`${kpis.utilization.toFixed(0)}%`}
          icon={Gauge}
          tone="brand"
          subtitle={`${kpis.billableActive} of ${kpis.activeTotal} active`}
          progress={kpis.utilization}
        />

        {/* Expiry risk */}
        <KPICard
          label="Auth Expiry Risk"
          value={kpis.expiryRisk}
          icon={AlertTriangle}
          tone={kpis.expiringByBucket.expired > 0 ? 'red' : kpis.expiringByBucket.d30 > 0 ? 'amber' : 'slate'}
          subtitle={
            kpis.expiringByBucket.d60 + kpis.expiringByBucket.d90 > 0
              ? `+${kpis.expiringByBucket.d60 + kpis.expiringByBucket.d90} in 60–90 days`
              : 'next 30 days incl. expired'
          }
        />

        {/* Bench */}
        <KPICard
          label="On Bench"
          value={kpis.bench}
          icon={UserMinus}
          tone={kpis.bench >= 10 ? 'amber' : 'slate'}
          subtitle="active w/o client or non-billable"
        />

        {/* Time-to-onboard + sparkline */}
        <KPICard
          label="Hires (24 wk)"
          value={kpis.hireTrend.reduce((s, n) => s + n, 0)}
          icon={TimerReset}
          tone="purple"
          subtitle={
            kpis.avgTimeToOnboard !== null
              ? `${kpis.avgTimeToOnboard}d avg onboard`
              : 'onboarding history not available'
          }
          trail={
            <div className="flex items-center gap-2">
              <Sparkline
                data={kpis.hireTrend}
                width={84}
                height={26}
                strokeClassName="stroke-purple-500"
                fillClassName="fill-purple-200"
              />
              {kpis.trendDelta !== 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    kpis.trendDelta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}
                >
                  {kpis.trendDelta > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(kpis.trendDelta)}%
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Insights strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight, i) => (
          <InsightPill key={i} tone={insight.tone} icon={insight.icon} text={insight.text} />
        ))}
      </div>
    </section>
  );
}

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone: 'emerald' | 'brand' | 'amber' | 'red' | 'purple' | 'slate';
  subtitle?: React.ReactNode;
  trail?: React.ReactNode;
  progress?: number;
}

const kpiToneStyles: Record<KPICardProps['tone'], { iconBg: string; iconColor: string; progressBg: string }> = {
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', progressBg: 'bg-emerald-500' },
  brand: { iconBg: 'bg-brand-100', iconColor: 'text-brand-600', progressBg: 'bg-brand-500' },
  amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', progressBg: 'bg-amber-500' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-600', progressBg: 'bg-red-500' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', progressBg: 'bg-purple-500' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600', progressBg: 'bg-slate-400' },
};

function KPICard({ label, value, icon: Icon, tone, subtitle, trail, progress }: KPICardProps) {
  const t = kpiToneStyles[tone];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', t.iconBg)}>
          <Icon className={cn('h-5 w-5', t.iconColor)} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {typeof progress === 'number' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all', t.progressBg)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {trail}
    </div>
  );
}

const insightToneStyles = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-600', ring: 'ring-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-600', ring: 'ring-red-200' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-800', icon: 'text-brand-600', ring: 'ring-brand-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
};

function InsightPill({
  tone,
  icon: Icon,
  text,
}: {
  tone: keyof typeof insightToneStyles;
  icon: React.ElementType;
  text: string;
}) {
  const t = insightToneStyles[tone];
  return (
    <div className={cn('flex items-start gap-2.5 rounded-2xl px-4 py-3 ring-1', t.bg, t.ring)}>
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', t.icon)} />
      <p className={cn('text-xs font-medium leading-relaxed', t.text)}>{text}</p>
    </div>
  );
}
