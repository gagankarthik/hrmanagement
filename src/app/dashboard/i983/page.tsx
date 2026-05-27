'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Search, Download, ChevronRight, PlayCircle, CalendarClock, FileWarning, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useEmployees } from '@/context/EmployeeContext';
import { useI983 } from '@/context/I983Context';
import { exportToCsv } from '@/lib/export';
import { cn } from '@/lib/utils';
import { I983Status, deriveI983Status, nextEvaluationDue } from '@/types/i983';
import type { Employee } from '@/types/employee';

const I983_BADGE: Record<I983Status, string> = {
  Draft: 'bg-slate-100 text-slate-500 ring-slate-200',
  Active: 'bg-sky-50 text-sky-700 ring-sky-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
const isOptAuth = (wa?: string) => !!wa && /opt/i.test(wa);
const isActive = (e: Employee) => !('status' in e) || (e as { status?: string }).status !== 'Terminated';

export default function I983Page() {
  const router = useRouter();
  const { employees } = useEmployees();
  const { records } = useI983();
  const [search, setSearch] = useState('');

  const recByEmp = useMemo(() => {
    const m: Record<string, (typeof records)[number]> = {};
    records.forEach((r) => { m[r.employeeId] = r; });
    return m;
  }, [records]);

  const activeEmps = useMemo(() => employees.filter((e) => e && e.id && isActive(e)), [employees]);
  const workAuthOf = (e: Employee) => ('workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined);

  const started = useMemo(() =>
    activeEmps
      .filter((e) => recByEmp[e.id])
      .map((e) => {
        const rec = recByEmp[e.id];
        const workAuth = workAuthOf(e);
        return { e, status: (rec.status || deriveI983Status(rec)) as I983Status, workAuth, opt: isOptAuth(workAuth), next: nextEvaluationDue(rec) };
      })
      .sort((a, b) => (a.e.name || '').localeCompare(b.e.name || '')),
    [activeEmps, recByEmp],
  );

  const q = search.trim().toLowerCase();
  const matches = useMemo(() => (q ? activeEmps.filter((e) => e.name?.toLowerCase().includes(q)).slice(0, 8) : []), [q, activeEmps]);

  const activeCount = started.filter((r) => r.status === 'Active').length;
  const completedCount = started.filter((r) => r.status === 'Completed').length;
  const evalsDueCount = started.filter((r) => r.next && r.next.dueDate && (r.next.overdue || r.next.days <= 30)).length;
  const materialChangesCount = records.reduce((sum, r) => sum + (r.materialChanges?.length || 0), 0);

  const handleExport = () => {
    exportToCsv('i983-stem-opt', started as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Employee', value: (r) => (r as unknown as (typeof started)[number]).e.name || '' },
      { key: 'type', label: 'Type', value: (r) => (r as unknown as (typeof started)[number]).e.type },
      { key: 'workAuth', label: 'Work Auth', value: (r) => (r as unknown as (typeof started)[number]).workAuth || '' },
      { key: 'status', label: 'I-983 Status', value: (r) => (r as unknown as (typeof started)[number]).status },
      { key: 'nextEval', label: 'Next Evaluation', value: (r) => { const n = (r as unknown as (typeof started)[number]).next; return n && n.dueDate ? `${n.label} · ${n.dueDate}` : ''; } },
    ]);
  };

  const fmtDue = (next: NonNullable<(typeof started)[number]['next']>) => {
    if (!next.dueDate) return next.label;
    const d = new Date(next.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return next.overdue ? `${d} · ${Math.abs(next.days)}d overdue` : `${d} · in ${next.days}d`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        eyebrow="Compliance"
        title="Form I-983 · STEM OPT"
        description="Track STEM OPT training plans, the 12- and 24-month evaluations, and material changes — with a full audit trail."
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={!started.length} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" strokeWidth={1.75} /> Export CSV
          </button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Active plans" value={activeCount} icon={PlayCircle} tone="sky" hint={`${activeEmps.length} active employees`} />
        <StatCard label="Evaluations due" value={evalsDueCount} icon={CalendarClock} tone="amber" hint="Overdue or due within 30 days" />
        <StatCard label="Material changes logged" value={materialChangesCount} icon={FileWarning} tone="purple" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} tone="emerald" />
      </StatGrid>

      {/* Search → open or start an I-983 for any employee */}
      <div className="surface relative p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search an employee to open or start their I-983…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {q && (
          <div className="absolute left-4 right-4 z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {matches.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">No employees match “{search.trim()}”.</p>
            ) : (
              matches.map((e) => {
                const wa = workAuthOf(e);
                return (
                  <button key={e.id} onMouseDown={() => router.push(`/dashboard/i983/${e.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{e.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</span>
                      <span className="block truncate text-xs text-slate-400">{e.type} · {wa || 'no work auth'}</span>
                    </span>
                    {isOptAuth(wa) && <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">STEM OPT</span>}
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.75} />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Started plans only */}
      <div className="surface">
        {started.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={GraduationCap} tone="brand" title="No I-983 plans yet" description="Use the search above to open a STEM OPT employee and start their training plan." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Employee', 'Work auth', 'I-983 status', 'Next evaluation', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {started.map(({ e, status, workAuth, opt, next }) => (
                  <tr key={e.id} onClick={() => router.push(`/dashboard/i983/${e.id}`)} className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{e.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        <p className="text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">{workAuth || '—'}</span>
                        {opt && <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">STEM OPT</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', I983_BADGE[status])}>{status}</span></td>
                    <td className="px-5 py-3.5 text-sm">
                      {next && next.dueDate ? (
                        <span className={cn('font-medium', next.overdue ? 'text-red-600' : next.days <= 30 ? 'text-amber-600' : 'text-slate-600')}>{fmtDue(next)}</span>
                      ) : next ? (
                        <span className="text-slate-400">{next.label} · no date</span>
                      ) : (
                        <span className="text-slate-400">{status === 'Completed' ? 'Complete' : '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">Manage <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-400">Showing {started.length} plan{started.length !== 1 ? 's' : ''}. Tracks I-983 completion and the STEM OPT 12- and 24-month evaluations — a record for your files, not a submission to USCIS/SEVP.</p></div>
      </div>
    </div>
  );
}
