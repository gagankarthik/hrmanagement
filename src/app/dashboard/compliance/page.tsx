'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserX,
  FileText,
  ArrowRight,
  ChevronRight,
  ShieldX,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DonutChart, CompareBarChart, VIZ } from '@/components/dashboard/Charts';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/context/EmployeeContext';
import { useHandbook } from '@/context/HandbookContext';
import { Employee, EmployeeType } from '@/types/employee';
import { cn } from '@/lib/utils';

const EMPLOYEE_TYPES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const typeChip: Record<EmployeeType, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-blue-100',
  Contract: 'bg-purple-50 text-purple-700 ring-purple-100',
  '1099': 'bg-teal-50 text-teal-700 ring-teal-100',
  Offshore: 'bg-pink-50 text-pink-700 ring-pink-100',
};

const avatarTone: Record<EmployeeType, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

type RiskBucket = 'expired' | 'expiring30' | 'expiring90' | 'valid';

const bucketPill: Record<Exclude<RiskBucket, 'valid'>, { label: string; className: string }> = {
  expired: { label: 'Expired', className: 'bg-red-50 text-red-700 ring-red-100' },
  expiring30: { label: 'Expiring ≤30d', className: 'bg-amber-50 text-amber-700 ring-amber-100' },
  expiring90: { label: 'Expiring ≤90d', className: 'bg-sky-50 text-sky-700 ring-sky-100' },
};

interface AuthRow {
  id: string;
  name: string;
  type: EmployeeType;
  workAuthorization: string;
  expiryDate: string;
  daysRemaining: number;
  bucket: Exclude<RiskBucket, 'valid'>;
}

interface ProfileGap {
  id: string;
  name: string;
  type: EmployeeType;
  missing: string[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Type-narrowing helpers (read-only; no mutation of source data).
function hasExpiry(e: Employee): e is Exclude<Employee, { type: 'Offshore' }> {
  return e.type !== 'Offshore';
}
function isActive(e: Employee): boolean {
  return 'status' in e && e.status === 'Active';
}

export default function CompliancePage() {
  const router = useRouter();
  const { employees, isLoading } = useEmployees();
  const { getPolicy } = useHandbook();

  // 1 — Work-authorization compliance buckets (active, non-Offshore, with expiry)
  const authStats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let expired = 0;
    let expiring30 = 0;
    let expiring90 = 0;
    let valid = 0;
    const atRisk: AuthRow[] = [];

    employees.forEach((e) => {
      if (!hasExpiry(e) || !isActive(e) || !e.expiryDate) return;
      const expiry = new Date(e.expiryDate);
      if (Number.isNaN(expiry.getTime())) return;
      expiry.setHours(0, 0, 0, 0);
      const daysRemaining = Math.round((expiry.getTime() - now.getTime()) / MS_PER_DAY);

      let bucket: RiskBucket;
      if (daysRemaining < 0) {
        bucket = 'expired';
        expired += 1;
      } else if (daysRemaining <= 30) {
        bucket = 'expiring30';
        expiring30 += 1;
      } else if (daysRemaining <= 90) {
        bucket = 'expiring90';
        expiring90 += 1;
      } else {
        bucket = 'valid';
        valid += 1;
      }

      if (bucket !== 'valid') {
        atRisk.push({
          id: e.id,
          name: e.name || 'Unnamed',
          type: e.type,
          workAuthorization: e.workAuthorization || '—',
          expiryDate: e.expiryDate,
          daysRemaining,
          bucket,
        });
      }
    });

    atRisk.sort((a, b) => a.daysRemaining - b.daysRemaining);
    const totalTracked = expired + expiring30 + expiring90 + valid;
    return { expired, expiring30, expiring90, valid, atRisk, totalTracked };
  }, [employees]);

  // 1a — Work-authorization breakdown across all employees (for the donut)
  const authBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((e) => {
      let key: string;
      if (e.type === 'Offshore') key = 'Not applicable (Offshore)';
      else key = e.workAuthorization?.trim() || 'Unspecified';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const palette = [
      VIZ.brand, VIZ.blue, VIZ.violet, VIZ.teal, VIZ.amber,
      VIZ.sky, VIZ.rose, VIZ.emerald, VIZ.pink,
    ];
    const data = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color:
          name === 'Not applicable (Offshore)' || name === 'Unspecified'
            ? VIZ.slate
            : palette[i % palette.length],
      }));
    return data;
  }, [employees]);

  // 1b — Authorizations expiring within 30 / 60 / 90 days (cumulative windows)
  const expiringWindows = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let within30 = 0;
    let within60 = 0;
    let within90 = 0;
    employees.forEach((e) => {
      if (!hasExpiry(e) || !isActive(e) || !e.expiryDate) return;
      const expiry = new Date(e.expiryDate);
      if (Number.isNaN(expiry.getTime())) return;
      expiry.setHours(0, 0, 0, 0);
      const days = Math.round((expiry.getTime() - now.getTime()) / MS_PER_DAY);
      if (days < 0) return; // already expired — surfaced separately
      if (days <= 30) within30 += 1;
      if (days <= 60) within60 += 1;
      if (days <= 90) within90 += 1;
    });
    return [
      { window: '≤ 30 days', count: within30 },
      { window: '≤ 60 days', count: within60 },
      { window: '≤ 90 days', count: within90 },
    ];
  }, [employees]);

  const hasExpiringData = expiringWindows.some((w) => w.count > 0);

  // 2 — Profile completeness (key compliance data present)
  const profileGaps = useMemo(() => {
    const gaps: ProfileGap[] = [];
    let complete = 0;

    employees.forEach((e) => {
      if (!isActive(e)) return;
      const missing: string[] = [];
      if (e.type === 'Offshore') {
        if (!e.aadharNumber?.trim()) missing.push('Aadhar number');
        if (!e.panNumber?.trim()) missing.push('PAN number');
      } else if (!e.workAuthorization?.trim()) {
        missing.push('Work authorization');
      }

      if (missing.length === 0) {
        complete += 1;
      } else {
        gaps.push({ id: e.id, name: e.name || 'Unnamed', type: e.type, missing });
      }
    });

    gaps.sort((a, b) => b.missing.length - a.missing.length || a.name.localeCompare(b.name));
    return { gaps, complete, totalActive: complete + gaps.length };
  }, [employees]);

  // 3 — Policy coverage per category
  const policyCoverage = useMemo(() => {
    return EMPLOYEE_TYPES.map((type) => {
      const policy = getPolicy(type);
      const covered = (policy.annualLeaveAllowance ?? 0) > 0 || Boolean(policy.rules?.trim());
      return { type, covered, allowance: policy.annualLeaveAllowance ?? 0 };
    });
  }, [getPolicy]);

  const coveredCount = policyCoverage.filter((p) => p.covered).length;

  // 4 — Overall compliance health
  const health = useMemo(() => {
    const compliant = authStats.valid + profileGaps.complete + coveredCount;
    const total = authStats.totalTracked + profileGaps.totalActive + EMPLOYEE_TYPES.length;
    const pct = total > 0 ? Math.round((compliant / total) * 100) : 100;
    return { compliant, total, pct };
  }, [authStats.valid, authStats.totalTracked, profileGaps.complete, profileGaps.totalActive, coveredCount]);

  const healthTone =
    health.pct >= 85 ? 'emerald' : health.pct >= 60 ? 'amber' : 'red';
  const healthDonut = useMemo(
    () => [
      { name: 'Compliant', value: health.compliant, color: '#059669' },
      { name: 'Needs attention', value: Math.max(health.total - health.compliant, 0), color: '#e2e8f0' },
    ],
    [health.compliant, health.total]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Company"
        title="Compliance"
        description="Work authorization, data completeness, and policy coverage at a glance"
        tone="amber"
      />

      {/* KPI cards — work-auth buckets */}
      <StatGrid cols={4}>
        <StatCard
          label="Valid authorizations"
          value={authStats.valid}
          icon={CheckCircle2}
          tone="emerald"
          hint={`of ${authStats.totalTracked} tracked`}
        />
        <StatCard
          label="Expiring within 30 days"
          value={authStats.expiring30}
          icon={AlertTriangle}
          tone="amber"
          hint="Needs renewal soon"
        />
        <StatCard
          label="Expiring within 90 days"
          value={authStats.expiring90}
          icon={Clock}
          tone="sky"
          hint="On the horizon"
        />
        <StatCard
          label="Expired authorizations"
          value={authStats.expired}
          icon={ShieldX}
          tone="red"
          hint="Active employees, past expiry"
        />
      </StatGrid>

      {/* ── Infographics: work-auth breakdown + expiry windows ── */}
      <section className="grid gap-6 lg:grid-cols-5">
        {/* Work-authorization breakdown donut */}
        <div
          className="surface lg:col-span-2 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
          style={{ animationDelay: '20ms' }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <PieChartIcon className="h-4 w-4 text-sky-600" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Work authorization mix</h2>
              <p className="text-xs text-slate-400">Across all {employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="p-5">
            {authBreakdown.length > 0 ? (
              <DonutChart data={authBreakdown} height={240} />
            ) : (
              <EmptyState
                icon={PieChartIcon}
                tone="sky"
                title="No employees yet"
                description="Add employees to see the work-authorization breakdown."
              />
            )}
          </div>
        </div>

        {/* Expiring within 30 / 60 / 90 days bar chart */}
        <div
          className="surface lg:col-span-3 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <BarChart3 className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Upcoming expirations</h2>
              <p className="text-xs text-slate-400">Active authorizations expiring within each window</p>
            </div>
          </div>
          <div className="p-5">
            {hasExpiringData ? (
              <CompareBarChart
                data={expiringWindows as unknown as Record<string, unknown>[]}
                xKey="window"
                bars={[{ key: 'count', name: 'Authorizations', color: VIZ.amber }]}
                height={240}
              />
            ) : (
              <EmptyState
                icon={CheckCircle2}
                tone="emerald"
                title="Nothing expiring soon"
                description="No active authorizations are due to expire within the next 90 days."
              />
            )}
          </div>
        </div>
      </section>

      {/* Compliance health + policy coverage */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Health headline */}
        <div
          className="surface flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
          style={{ animationDelay: '40ms' }}
        >
          <p className="eyebrow mb-3">Compliance health</p>
          {health.total > 0 ? (
            <>
              <div className="relative">
                <DonutChart data={healthDonut} height={180} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                  <span
                    className={cn(
                      'font-display text-4xl font-bold tabular-nums',
                      healthTone === 'emerald' && 'text-emerald-600',
                      healthTone === 'amber' && 'text-amber-600',
                      healthTone === 'red' && 'text-red-600'
                    )}
                  >
                    {health.pct}%
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    compliant
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-bold tabular-nums text-slate-900">{health.compliant}</span> of{' '}
                <span className="font-bold tabular-nums text-slate-900">{health.total}</span> checks passing
              </p>
            </>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              tone="amber"
              title="Nothing to check yet"
              description="Add active employees and policies to see your compliance score."
            />
          )}
        </div>

        {/* Policy coverage checklist */}
        <div
          className="surface lg:col-span-2 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                <FileText className="h-4 w-4 text-brand-700" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">Policy coverage</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {coveredCount}/{EMPLOYEE_TYPES.length}
              </span>
            </div>
            <Link
              href="/dashboard/policies"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              Manage policies
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {policyCoverage.map((p) => (
              <li key={p.type} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                      typeChip[p.type]
                    )}
                  >
                    {p.type}
                  </span>
                  <span className="text-sm text-slate-600">
                    {p.covered
                      ? p.allowance > 0
                        ? `${p.allowance} annual leave days set`
                        : 'Rules defined'
                      : 'No leave policy or rules set'}
                  </span>
                </div>
                {p.covered ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Configured
                  </span>
                ) : (
                  <Link
                    href="/dashboard/policies"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Set up
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Work-authorization at-risk table */}
      <section
        className="surface animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
        style={{ animationDelay: '160ms' }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Work authorization at risk</h2>
              <p className="text-xs text-slate-400">Expired or expiring within 90 days · soonest first</p>
            </div>
          </div>
          {authStats.atRisk.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {authStats.atRisk.length}
            </span>
          )}
        </div>

        {authStats.atRisk.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CheckCircle2}
              tone="emerald"
              title="No authorizations at risk"
              description="Every active employee's work authorization is valid for more than 90 days."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Work auth</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3 text-right">Days left</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authStats.atRisk.map((row) => {
                  const pill = bucketPill[row.bucket];
                  let expiryLabel = row.expiryDate;
                  const d = new Date(row.expiryDate);
                  if (!Number.isNaN(d.getTime())) expiryLabel = format(d, 'MMM d, yyyy');
                  return (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/dashboard/employees/${row.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                              avatarTone[row.type]
                            )}
                          >
                            {initials(row.name)}
                          </span>
                          <span className="font-semibold text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                            typeChip[row.type]
                          )}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.workAuthorization}</td>
                      <td className="px-5 py-3 text-slate-600 tabular-nums">{expiryLabel}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">
                        {row.daysRemaining < 0
                          ? `${Math.abs(row.daysRemaining)}d ago`
                          : `${row.daysRemaining}d`}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                            pill.className
                          )}
                        >
                          {pill.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Profile completeness */}
      <section
        className="surface animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <UserX className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Profile completeness</h2>
              <p className="text-xs text-slate-400">
                Active employees missing key compliance data
              </p>
            </div>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-bold',
              profileGaps.gaps.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {profileGaps.gaps.length}
          </span>
        </div>

        {profileGaps.gaps.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CheckCircle2}
              tone="emerald"
              title="All profiles complete"
              description="Every active employee has the required work-authorization or ID details on file."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {profileGaps.gaps.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/dashboard/employees/${g.id}`}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                        avatarTone[g.type]
                      )}
                    >
                      {initials(g.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                        {g.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {g.missing.map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-100"
                          >
                            Missing {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                      typeChip[g.type]
                    )}
                  >
                    {g.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
