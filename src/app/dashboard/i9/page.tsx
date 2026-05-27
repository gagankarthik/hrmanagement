'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Search, Download, ChevronRight, ShieldCheck, Clock, CircleDashed, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useEmployees } from '@/context/EmployeeContext';
import { useI9 } from '@/context/I9Context';
import { exportToCsv } from '@/lib/export';
import { cn } from '@/lib/utils';
import { I9Status, EverifyStatus, deriveI9Status, i9RetentionDate } from '@/types/i9';
import type { Employee } from '@/types/employee';

const I9_BADGE: Record<I9Status, string> = {
  'Not started': 'bg-slate-100 text-slate-500 ring-slate-200',
  'Section 1 complete': 'bg-sky-50 text-sky-700 ring-sky-200',
  'Pending verification': 'bg-accent-50 text-accent-700 ring-accent-200',
  Verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'E-Verified': 'bg-brand-50 text-brand-700 ring-brand-200',
};
const EV_BADGE: Record<EverifyStatus, string> = {
  'Not submitted': 'bg-slate-100 text-slate-500 ring-slate-200',
  Submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Employment Authorized': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Tentative Nonconfirmation': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Final Nonconfirmation': 'bg-red-50 text-red-600 ring-red-200',
  Closed: 'bg-slate-100 text-slate-500 ring-slate-200',
};
const fmtDate = (d?: Date | null) => (d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const isActive = (e: Employee) => !('status' in e) || (e as { status?: string }).status !== 'Terminated';

export default function I9Page() {
  const router = useRouter();
  const { employees } = useEmployees();
  const { records } = useI9();
  const [search, setSearch] = useState('');

  const recByEmp = useMemo(() => {
    const m: Record<string, (typeof records)[number]> = {};
    records.forEach((r) => { m[r.employeeId] = r; });
    return m;
  }, [records]);

  const activeEmps = useMemo(() => employees.filter((e) => e && e.id && isActive(e)), [employees]);
  const statusOf = (e: Employee): I9Status => { const r = recByEmp[e.id]; return r ? (r.status || deriveI9Status(r)) : 'Not started'; };

  // Only employees with a started I-9 are listed.
  const started = useMemo(() =>
    activeEmps
      .filter((e) => recByEmp[e.id])
      .map((e) => {
        const rec = recByEmp[e.id];
        return { e, status: (rec.status || deriveI9Status(rec)) as I9Status, everify: (rec.everifyStatus || 'Not submitted') as EverifyStatus, retain: i9RetentionDate(e.hireDate, 'dor' in e ? (e as { dor?: string }).dor : undefined) };
      })
      .sort((a, b) => (a.e.name || '').localeCompare(b.e.name || '')),
    [activeEmps, recByEmp],
  );

  const q = search.trim().toLowerCase();
  const matches = useMemo(() => (q ? activeEmps.filter((e) => e.name?.toLowerCase().includes(q)).slice(0, 8) : []), [q, activeEmps]);

  const count = (s: I9Status) => activeEmps.filter((e) => statusOf(e) === s).length;
  const completeCount = activeEmps.filter((e) => ['Verified', 'E-Verified'].includes(statusOf(e))).length;
  const everifiedCount = started.filter((r) => r.everify === 'Employment Authorized').length;

  const handleExport = () => {
    exportToCsv('i9-status', started as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Employee', value: (r) => (r as unknown as (typeof started)[number]).e.name || '' },
      { key: 'type', label: 'Type', value: (r) => (r as unknown as (typeof started)[number]).e.type },
      { key: 'i9', label: 'I-9 Status', value: (r) => (r as unknown as (typeof started)[number]).status },
      { key: 'everify', label: 'E-Verify', value: (r) => (r as unknown as (typeof started)[number]).everify },
      { key: 'retain', label: 'Retain Until', value: (r) => { const d = (r as unknown as (typeof started)[number]).retain; return d ? d.toISOString().slice(0, 10) : ''; } },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BadgeCheck}
        eyebrow="Compliance"
        title="Form I-9 & E-Verify"
        description="Complete, verify, and retain employment-eligibility records — with a full audit trail."
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={!started.length} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" strokeWidth={1.75} /> Export CSV
          </button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Verified" value={completeCount} icon={ShieldCheck} tone="emerald" hint={`${activeEmps.length} active employees`} />
        <StatCard label="E-Verified" value={everifiedCount} icon={BadgeCheck} tone="brand" />
        <StatCard label="Pending verification" value={count('Pending verification') + count('Section 1 complete')} icon={Clock} tone="amber" />
        <StatCard label="Not started" value={count('Not started')} icon={CircleDashed} tone="slate" />
      </StatGrid>

      {/* Search → open or start an I-9 for any employee */}
      <div className="surface relative p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search an employee to open or start their I-9…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {q && (
          <div className="absolute left-4 right-4 z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {matches.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">No employees match “{search.trim()}”.</p>
            ) : (
              matches.map((e) => {
                const st = statusOf(e);
                return (
                  <button
                    key={e.id}
                    onMouseDown={() => { router.push(`/dashboard/i9/${e.id}`); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{e.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</span>
                      <span className="block truncate text-xs text-slate-400">{e.type}</span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', I9_BADGE[st])}>{st}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.75} />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Started records only */}
      <div className="surface">
        {started.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={BadgeCheck} tone="brand" title="No I-9s started yet" description="Use the search above to open an employee and complete their Form I-9." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Employee', 'Type', 'I-9 status', 'E-Verify', 'Retain until', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {started.map(({ e, status, everify, retain }) => (
                  <tr key={e.id} onClick={() => router.push(`/dashboard/i9/${e.id}`)} className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{e.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        <p className="text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{e.type}</td>
                    <td className="px-5 py-3.5"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', I9_BADGE[status])}>{status}</span></td>
                    <td className="px-5 py-3.5"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', EV_BADGE[everify])}>{everify}</span></td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtDate(retain)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">Manage <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-400">Showing {started.length} started record{started.length !== 1 ? 's' : ''}. Retention = later of 3 years after hire or 1 year after termination. E-Verify status is tracked here, not submitted to DHS.</p></div>
      </div>
    </div>
  );
}
