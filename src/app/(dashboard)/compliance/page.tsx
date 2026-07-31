'use client';

import React, { useMemo, useState } from 'react';
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
  ChevronRight,
  ShieldX,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DonutChart, VIZ } from '@/components/dashboard/Charts';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/context/EmployeeContext';
import { useHandbook } from '@/context/HandbookContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { coiStatus } from '@/lib/coi';
import { Employee, EmployeeType } from '@/types/employee';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

const EMPLOYEE_TYPES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const typeChip: Record<EmployeeType, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-blue-100',
  Contract: 'bg-purple-50 text-purple-700 ring-purple-100',
  '1099': 'bg-teal-50 text-teal-700 ring-teal-100',
  Offshore: 'bg-pink-50 text-pink-700 ring-pink-100',
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
  const { subcontractors } = useSubcontractors();
  const [riskFilter, setRiskFilter] = useState<'all' | 'expired' | '30' | '60' | '90'>('all');

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
    const palette = [VIZ.brand, VIZ.blue, VIZ.violet, VIZ.teal, VIZ.amber, VIZ.sky, VIZ.rose];
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    // Cap the legend at the top categories + a grouped "Other" so it never
    // overflows the card when there are many work-authorization types.
    const TOP = 7;
    const isMuted = (name: string) => name === 'Not applicable (Offshore)' || name === 'Unspecified';
    const data = sorted.slice(0, TOP).map(([name, value], i) => ({
      name,
      value,
      color: isMuted(name) ? VIZ.slate : palette[i % palette.length],
    }));
    const rest = sorted.slice(TOP);
    if (rest.length) {
      data.push({ name: `Other (${rest.length})`, value: rest.reduce((s, [, v]) => s + v, 0), color: VIZ.slate });
    }
    return data;
  }, [employees]);

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

  // At-risk rows filtered by the chosen window (cumulative; expired shown separately).
  const visibleRisk = useMemo(() => {
    return authStats.atRisk.filter((r) => {
      if (riskFilter === 'all') return true;
      if (riskFilter === 'expired') return r.daysRemaining < 0;
      return r.daysRemaining >= 0 && r.daysRemaining <= Number(riskFilter);
    });
  }, [authStats.atRisk, riskFilter]);

  // Subcontractor COI policies expiring within 60 days (or already expired).
  const coiExpiring = useMemo(
    () =>
      subcontractors
        .map((s) => ({ s, coi: coiStatus(s.coiExpiryDate) }))
        .filter(({ coi }) => coi.state === 'expiring' || coi.state === 'expired')
        .sort((a, b) => (a.coi.days ?? 0) - (b.coi.days ?? 0)),
    [subcontractors],
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
    <PageContainer>
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

      {/* Overview — health · work-auth mix · policy coverage */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Compliance health */}
        <div className="surface flex flex-col items-center justify-center p-6 text-center">
          <p className="eyebrow mb-3">Compliance health</p>
          {health.total > 0 ? (
            <>
              <div className="relative w-full max-w-[260px]">
                <DonutChart data={healthDonut} height={180} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                  <span className={cn('text-[22px] font-bold leading-none tabular-nums tracking-[-0.02em]', healthTone === 'emerald' && 'text-emerald-600', healthTone === 'amber' && 'text-amber-600', healthTone === 'red' && 'text-red-600')}>{health.pct}%</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">compliant</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-bold tabular-nums text-slate-900">{health.compliant}</span> of{' '}
                <span className="font-bold tabular-nums text-slate-900">{health.total}</span> checks passing
              </p>
            </>
          ) : (
            <EmptyState icon={ShieldCheck} tone="amber" title="Nothing to check yet" description="Add active employees and policies to see your score." />
          )}
        </div>

        {/* Work authorization mix */}
        <div className="surface">
          <div className="flex items-center gap-2 border-b border-[var(--adm-line)] px-5 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)]">
              <PieChartIcon className="h-4 w-4 text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Work authorization mix</h2>
              <p className="text-xs text-slate-400">Across all {employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="p-5">
            {authBreakdown.length > 0 ? (
              <DonutChart data={authBreakdown} height={200} />
            ) : (
              <EmptyState icon={PieChartIcon} tone="sky" title="No employees yet" description="Add employees to see the breakdown." />
            )}
          </div>
        </div>

        {/* Policy coverage */}
        <div className="surface flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--adm-line)] px-5 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)]">
              <FileText className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
            </div>
            <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Policy coverage</h2>
            <span className="rounded-full bg-[var(--adm-surface-2)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--adm-ink-mute)]">{coveredCount}/{EMPLOYEE_TYPES.length}</span>
          </div>
          <ul className="flex-1 divide-y divide-[var(--adm-line)]">
            {policyCoverage.map((p) => (
              <li key={p.type} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className={cn('inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11.5px] font-semibold', typeChip[p.type])}>{p.type}</span>
                {p.covered ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Configured</span>
                ) : (
                  <Link href="/policies" className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><ShieldAlert className="h-4 w-4" /> Set up</Link>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--adm-line)] px-5 py-2.5">
            <Link href="/policies" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">Manage policies <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* Work-authorization at-risk table */}
      <section className="surface">
        <div className="flex flex-col gap-3 border-b border-[var(--adm-line)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)]">
              <ShieldAlert className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Work authorization at risk</h2>
              <p className="text-xs text-slate-400">Active employees, expired or expiring soon · soonest first</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'all', label: 'All' },
              { id: 'expired', label: 'Expired' },
              { id: '30', label: '≤ 30 days' },
              { id: '60', label: '≤ 60 days' },
              { id: '90', label: '≤ 90 days' },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setRiskFilter(f.id)}
                className={cn(
                  'rounded-[6px] px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  riskFilter === f.id ? 'bg-[var(--adm-accent)] text-white' : 'bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-line-soft)] hover:text-[var(--adm-ink)]',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
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
        ) : visibleRisk.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CheckCircle2}
              tone="emerald"
              title="Nothing in this window"
              description="No authorizations match the selected window — try a wider range."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--adm-line)] text-left text-[13px] font-medium text-[var(--adm-head-ink)]">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Work auth</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3 text-right">Days left</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--adm-line)]">
                {visibleRisk.map((row) => {
                  const pill = bucketPill[row.bucket];
                  const expiryLabel = formatDate(row.expiryDate);
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/employees/${row.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/employees/${row.id}`);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-[var(--adm-row-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--adm-focus-ring)]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.name} />
                          <span className="font-semibold text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11.5px] font-semibold',
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
                            'inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11.5px] font-semibold',
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

      {/* Subcontractor COI expiry */}
      <section className="surface">
        <div className="flex items-center justify-between border-b border-[var(--adm-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)]">
              <ShieldCheck className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Subcontractor COI expiry</h2>
              <p className="text-xs text-slate-400">Insurance policies expiring within 60 days, per company</p>
            </div>
          </div>
          {coiExpiring.length > 0 && (
            <span className="rounded-full bg-[var(--adm-warning-soft)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--adm-warning)]">{coiExpiring.length}</span>
          )}
        </div>
        {coiExpiring.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ShieldCheck}
              tone="emerald"
              title="All COIs current"
              description="No subcontractor insurance policies are expiring within 60 days."
            />
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {coiExpiring.map(({ s, coi }) => {
              const expired = coi.state === 'expired';
              const chip = expired
                ? 'bg-red-50 text-red-600 ring-red-200'
                : (coi.days ?? 99) < 30
                  ? 'bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]'
                  : 'bg-amber-50 text-amber-700 ring-amber-200';
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/subcontractors/${s.id}`)}
                  className="group flex items-center gap-3 rounded-[10px] border border-[var(--adm-line)] bg-white px-4 py-3 text-left transition-colors hover:bg-[var(--adm-row-hover)]"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{s.name}</span>
                      <span className={cn('shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold', chip)}>
                        {expired ? `${Math.abs(coi.days ?? 0)}d overdue` : `${coi.days}d`}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-400">{coi.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Profile completeness */}
      <section
        className="surface animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--adm-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)]">
              <UserX className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Profile completeness</h2>
              <p className="text-xs text-slate-400">
                Active employees missing key compliance data
              </p>
            </div>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
              profileGaps.gaps.length > 0 ? 'bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]' : 'bg-[var(--adm-success-soft)] text-[var(--adm-success)]'
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
          <ul className="divide-y divide-[var(--adm-line)]">
            {profileGaps.gaps.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/employees/${g.id}`}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--adm-row-hover)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={g.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                        {g.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {g.missing.map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center rounded-[4px] bg-[var(--adm-danger-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--adm-danger)]"
                          >
                            Missing {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-[4px] px-2 py-0.5 text-[11.5px] font-semibold',
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
    </PageContainer>
  );
}
