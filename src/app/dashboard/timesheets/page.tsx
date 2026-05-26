'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Pencil, Trash2, ChevronRight, Download } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { ActionMenu } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useTimesheets } from '@/context/TimesheetContext';
import { exportToCsv } from '@/lib/export';
import { cn } from '@/lib/utils';
import { Timesheet, TimesheetStatus } from '@/types/timesheet';

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtDate = (s?: string) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');

const STATUS_BADGE: Record<TimesheetStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Invoiced: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function TimesheetsPage() {
  const router = useRouter();
  const { timesheets, isLoading, deleteTimesheet } = useTimesheets();
  const toast = useToast();
  const [del, setDel] = useState<{ ts: Timesheet | null; busy: boolean }>({ ts: null, busy: false });

  const valid = timesheets.filter((t) => t && t.id);
  const totalHours = valid.reduce((s, t) => s + (t.hours || 0), 0);
  const billable = valid.reduce((s, t) => s + (t.billRate || 0) * (t.hours || 0), 0);
  const gp = valid.reduce((s, t) => s + ((t.billRate || 0) - (t.payRate || 0)) * (t.hours || 0), 0);

  const confirmDelete = async () => {
    if (!del.ts) return;
    setDel((p) => ({ ...p, busy: true }));
    try {
      await deleteTimesheet(del.ts.id);
      toast.success('Timesheet deleted');
      setDel({ ts: null, busy: false });
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : 'Please try again.');
      setDel((p) => ({ ...p, busy: false }));
    }
  };

  const handleExport = () => {
    if (!valid.length) return;
    exportToCsv('timesheets', valid as unknown as Record<string, unknown>[], [
      { key: 'employeeName', label: 'Worker' },
      { key: 'clientName', label: 'Client' },
      { key: 'periodStart', label: 'Period start' },
      { key: 'periodEnd', label: 'Period end' },
      { key: 'hours', label: 'Hours' },
      { key: 'billRate', label: 'Bill rate' },
      { key: 'payRate', label: 'Pay rate' },
      { key: 'status', label: 'Status' },
    ]);
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />)}</div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Clock}
        eyebrow="Billing"
        title="Timesheets"
        description="Log billable hours per worker and period — the basis for client invoices."
        tone="brand"
        actions={
          <>
            <button onClick={handleExport} disabled={!valid.length} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" strokeWidth={1.75} /> Export CSV
            </button>
            <button onClick={() => router.push('/dashboard/timesheets/new')} className="btn-primary">
              <Plus className="h-4 w-4" strokeWidth={1.75} /> New timesheet
            </button>
          </>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Logged hours" value={totalHours.toLocaleString()} icon={Clock} tone="brand" hint={`${valid.length} timesheets`} />
        <StatCard label="Billable value" value={usd0(billable)} icon={Clock} tone="emerald" />
        <StatCard label="Gross profit" value={usd0(gp)} icon={Clock} tone="purple" />
      </StatGrid>

      <div className="surface">
        {valid.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Clock}
              tone="brand"
              title="No timesheets yet"
              description="Log hours for a worker to start tracking billable time and building invoices."
              action={<button onClick={() => router.push('/dashboard/timesheets/new')} className="btn-primary"><Plus className="h-4 w-4" strokeWidth={1.75} /> New timesheet</button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Worker', 'Client', 'Period', 'Hours', 'Bill total', 'GP', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {valid.map((t) => {
                  const billTotal = (t.billRate || 0) * (t.hours || 0);
                  const rowGp = ((t.billRate || 0) - (t.payRate || 0)) * (t.hours || 0);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/dashboard/timesheets/${t.id}/edit`)}
                      className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                            {t.employeeName?.charAt(0)?.toUpperCase() ?? '?'}
                          </span>
                          <p className="text-sm font-semibold text-slate-900">{t.employeeName || 'Unnamed'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{t.clientName || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{fmtDate(t.periodStart)} → {fmtDate(t.periodEnd)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{t.hours}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{usd0(billTotal)}</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-700">{usd0(rowGp)}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', STATUS_BADGE[t.status])}>{t.status}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionMenu
                            items={[
                              { label: 'Edit', icon: Pencil, onClick: () => router.push(`/dashboard/timesheets/${t.id}/edit`) },
                              { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDel({ ts: t, busy: false }) },
                            ]}
                          />
                          <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-400">{valid.length} timesheet{valid.length !== 1 ? 's' : ''}</p></div>
      </div>

      <ConfirmDialog
        isOpen={del.ts !== null}
        onClose={() => setDel({ ts: null, busy: false })}
        onConfirm={confirmDelete}
        title="Delete timesheet"
        description={del.ts ? <>Delete this timesheet for <span className="font-semibold text-slate-900">{del.ts.employeeName || 'this worker'}</span>? This cannot be undone.</> : null}
        confirmLabel="Delete"
        isLoading={del.busy}
      />
    </div>
  );
}
