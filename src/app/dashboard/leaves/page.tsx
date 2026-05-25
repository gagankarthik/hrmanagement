'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays, Plus, Pencil, Trash2, Search, Check, X, Eye,
  Clock, CheckCircle2, XCircle, Layers, Inbox, Scale, CalendarRange,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ActionMenu } from '@/components/ui/action-menu';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { useHandbook } from '@/context/HandbookContext';
import { Leave, LeaveStatus, LeaveType } from '@/types/leave';
import { resolveName } from '@/lib/names';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { exportToCsv } from '@/lib/export';

const STATUS_FILTERS: ('all' | LeaveStatus)[] = ['all', 'Pending', 'Approved', 'Rejected'];
const TYPE_FILTERS: ('all' | LeaveType)[] = ['all', 'Sick', 'Casual', 'PTO', 'Long Leave', 'Unpaid'];

const statusBadge: Record<LeaveStatus, { cls: string; icon: React.ElementType }> = {
  Pending: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Clock },
  Approved: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  Rejected: { cls: 'bg-red-50 text-red-600 ring-red-200', icon: XCircle },
};

const typeBadge: Record<LeaveType, string> = {
  Sick: 'bg-rose-50 text-rose-600',
  Casual: 'bg-sky-50 text-sky-600',
  PTO: 'bg-violet-50 text-violet-600',
  'Long Leave': 'bg-amber-50 text-amber-700',
  Unpaid: 'bg-slate-100 text-slate-600',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Date helpers for the calendar (work in local time, day-granular) ──────────
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function parseDay(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return startOfDay(d);
}
/** True if [startDate,endDate] of the leave overlaps the given calendar day. */
function leaveCoversDay(leave: Leave, day: Date): boolean {
  const start = parseDay(leave.startDate);
  const end = parseDay(leave.endDate) ?? start;
  if (!start) return false;
  const t = startOfDay(day).getTime();
  return t >= start.getTime() && t <= (end ?? start).getTime();
}
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

type TabKey = 'requested' | 'balances' | 'calendar';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'requested', label: 'Requested', icon: Inbox },
  { key: 'balances', label: 'Balances', icon: Scale },
  { key: 'calendar', label: 'Calendar', icon: CalendarRange },
];

export default function LeavesPage() {
  const { leaves, isLoading, updateLeave, deleteLeave } = useLeaves();
  const { employees } = useEmployees();
  const { getPolicy } = useHandbook();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('requested');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveType>('all');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [deleteState, setDeleteState] = useState<{ leave: Leave | null; isDeleting: boolean }>({
    leave: null, isDeleting: false,
  });
  const [decision, setDecision] = useState<{ leave: Leave; status: LeaveStatus } | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toast = useToast();

  const validLeaves = leaves.filter((l) => l && l.id);

  const nameOf = (employeeId: string) => resolveName(employeeId, employees, { unknown: 'Unknown employee' });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return validLeaves.filter((l) => {
      const matchSearch = !q || nameOf(l.employeeId).toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchType = typeFilter === 'all' || l.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validLeaves, employees, searchQuery, statusFilter, typeFilter]);

  // ── Requested-tab pagination (does not affect Balances/Calendar) ─────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 whenever the Requested filters/search change.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleExport = () => {
    exportToCsv('leave-requests', filtered as unknown as Record<string, unknown>[], [
      { key: 'employeeId', label: 'Employee', value: (l) => nameOf(l.employeeId as string) },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'days', label: 'Days' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ]);
  };

  const totalPending = validLeaves.filter((l) => l.status === 'Pending').length;
  const totalApproved = validLeaves.filter((l) => l.status === 'Approved').length;
  const totalRejected = validLeaves.filter((l) => l.status === 'Rejected').length;

  // Approved leaves indexed by employee, for balances & calendar.
  const approvedLeaves = useMemo(
    () => validLeaves.filter((l) => l.status === 'Approved'),
    [validLeaves]
  );

  // ── Balances rows ───────────────────────────────────────────────────────────
  const balanceRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees
      .filter((emp) => !q || emp.name.toLowerCase().includes(q))
      .map((emp) => {
        const empApproved = approvedLeaves.filter((l) => l.employeeId === emp.id);
        const used = empApproved.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
        const byType: Partial<Record<LeaveType, number>> = {};
        empApproved.forEach((l) => {
          byType[l.type] = (byType[l.type] ?? 0) + (Number(l.days) || 0);
        });
        const allowance = getPolicy(emp.type).annualLeaveAllowance || 0;
        const remaining = Math.max(0, allowance - used);
        return { emp, allowance, used, remaining, byType };
      });
  }, [employees, approvedLeaves, searchQuery, getPolicy]);

  // ── Calendar cells (only approved leaves shown) ───────────────────────────────
  const calCells = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstOfMonth.getDay(); // 0=Sun
    const cells: { date: Date | null; leaves: Leave[] }[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null, leaves: [] });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayLeaves = approvedLeaves.filter((l) => leaveCoversDay(l, date));
      cells.push({ date, leaves: dayLeaves });
    }
    // trailing blanks to complete the final week row
    while (cells.length % 7 !== 0) cells.push({ date: null, leaves: [] });
    return cells;
  }, [calMonth, approvedLeaves]);

  // Mobile vertical list: only days within the month that have approved leaves.
  const calMobileGroups = useMemo(
    () => calCells.filter((c) => c.date && c.leaves.length > 0),
    [calCells]
  );

  const confirmDelete = async () => {
    const leave = deleteState.leave;
    if (!leave) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteLeave(leave.id);
      toast.success('Leave request deleted', `${nameOf(leave.employeeId)}'s request has been removed.`);
      setDeleteState({ leave: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete leave request', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const confirmDecision = async () => {
    if (!decision) return;
    setDeciding(true);
    try {
      await updateLeave(decision.leave.id, { status: decision.status });
      toast.success(
        decision.status === 'Approved' ? 'Leave approved' : 'Leave rejected',
        `${nameOf(decision.leave.employeeId)}'s request has been ${decision.status.toLowerCase()}.`
      );
      setDecision(null);
    } catch (err) {
      toast.error('Could not update leave request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setDeciding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={CalendarDays}
        eyebrow="Time & Leave"
        title="Leave Management"
        description="Track and approve employee leave requests"
        tone="brand"
        actions={
          <button
            onClick={() => router.push('/dashboard/leaves/new')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Apply Leave
          </button>
        }
      />

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Pending" value={totalPending} icon={Clock} tone="amber" hint="awaiting review" />
        <StatCard label="Approved" value={totalApproved} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Rejected" value={totalRejected} icon={XCircle} tone="red" />
        <StatCard label="Total requests" value={validLeaves.length} icon={Layers} tone="slate" hint="all on record" />
      </StatGrid>

      {/* Tab switcher (segmented control) */}
      <div className="inline-flex w-full max-w-md items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 sm:w-auto">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-sm font-semibold transition-all sm:flex-none sm:px-4',
                active
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/[0.04]'
                  : 'text-slate-500 hover:text-slate-700'
              )}
              aria-pressed={active}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── REQUESTED TAB ── */}
      {activeTab === 'requested' && (
        <div className="surface">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                disabled={filtered.length === 0}
                className="btn-ghost"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {s === 'all' ? 'All status' : s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      typeFilter === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {t === 'all' ? 'All types' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CalendarDays}
                tone="brand"
                title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No leave requests match your filters' : 'No leave requests yet'}
                description={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try different keywords or clear filters.' : 'Apply for leave to start tracking time off.'}
                action={
                  !searchQuery && statusFilter === 'all' && typeFilter === 'all' ? (
                    <button
                      onClick={() => router.push('/dashboard/leaves/new')}
                      className="btn-primary"
                    >
                      <Plus className="h-4 w-4" /> Apply Leave
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Employee', 'Type', 'Dates', 'Days', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((leave, idx) => {
                    const name = nameOf(leave.employeeId);
                    const badge = statusBadge[leave.status];
                    const StatusIcon = badge.icon;
                    return (
                      <tr
                        key={leave.id ?? idx}
                        onClick={() => router.push(`/dashboard/leaves/${leave.id}`)}
                        className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                              {name.charAt(0).toUpperCase() || '?'}
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[leave.type])}>
                            {leave.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          <span className="whitespace-nowrap">{formatDate(leave.startDate)} <span className="text-slate-300">→</span> {formatDate(leave.endDate)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {leave.days} {leave.days === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', badge.cls)}>
                            <StatusIcon className="h-3 w-3" />
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {leave.status === 'Pending' && (
                              <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <button
                                  onClick={() => setDecision({ leave, status: 'Approved' })}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                  title="Approve"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDecision({ leave, status: 'Rejected' })}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Reject"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            <ActionMenu
                              items={[
                                {
                                  label: 'View details',
                                  icon: Eye,
                                  onClick: () => router.push(`/dashboard/leaves/${leave.id}`),
                                },
                                {
                                  label: 'Edit request',
                                  icon: Pencil,
                                  onClick: () => router.push(`/dashboard/leaves/${leave.id}/edit`),
                                },
                                {
                                  label: 'Delete request',
                                  icon: Trash2,
                                  danger: true,
                                  separatorBefore: true,
                                  onClick: () => setDeleteState({ leave, isDeleting: false }),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              {filtered.length === 0
                ? `0 of ${validLeaves.length} request${validLeaves.length !== 1 ? 's' : ''}`
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} request${filtered.length !== 1 ? 's' : ''}`}
            </p>
            {filtered.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  Rows:
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-300"
                  >
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BALANCES TAB ── */}
      {activeTab === 'balances' && (
        <BalancesPanel
          rows={balanceRows}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      )}

      {/* ── CALENDAR TAB ── */}
      {activeTab === 'calendar' && (
        <CalendarPanel
          month={calMonth}
          onMonthChange={setCalMonth}
          cells={calCells}
          mobileGroups={calMobileGroups}
          nameOf={nameOf}
          onChipClick={(id) => router.push(`/dashboard/leaves/${id}`)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteState.leave !== null}
        onClose={() => setDeleteState({ leave: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Leave Request"
        description={
          deleteState.leave ? (
            <>
              Are you sure you want to delete the leave request for{' '}
              <span className="font-semibold text-slate-900">{nameOf(deleteState.leave.employeeId)}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Request"
        isLoading={deleteState.isDeleting}
      />

      <ConfirmDialog
        isOpen={decision !== null}
        onClose={() => setDecision(null)}
        onConfirm={confirmDecision}
        title={decision?.status === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
        tone={decision?.status === 'Approved' ? 'default' : 'danger'}
        description={
          decision ? (
            <>
              {decision.status === 'Approved' ? 'Approve' : 'Reject'} the leave request for{' '}
              <span className="font-semibold text-slate-900">{nameOf(decision.leave.employeeId)}</span>{' '}
              ({decision.leave.days} {decision.leave.days === 1 ? 'day' : 'days'})?
            </>
          ) : null
        }
        confirmLabel={decision?.status === 'Approved' ? 'Approve' : 'Reject'}
        isLoading={deciding}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BALANCES PANEL
// ════════════════════════════════════════════════════════════════════════════

interface BalanceRow {
  emp: { id: string; name: string; type: import('@/types/employee').EmployeeType };
  allowance: number;
  used: number;
  remaining: number;
  byType: Partial<Record<LeaveType, number>>;
}

function BalancesPanel({
  rows,
  searchQuery,
  onSearch,
}: {
  rows: BalanceRow[];
  searchQuery: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="surface">
      {/* Toolbar — reuse the employee search */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Scale}
            tone="brand"
            title={searchQuery ? 'No employees match your search' : 'No employees yet'}
            description={searchQuery ? 'Try a different name.' : 'Add employees to see their leave balances.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee', 'Type', 'Allowance', 'Used', 'Remaining', 'Utilization', 'Breakdown'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, allowance, used, remaining, byType }) => {
                const ratio = allowance > 0 ? used / allowance : 0;
                const pct = Math.min(100, Math.round(ratio * 100));
                const barColor =
                  ratio > 1
                    ? 'bg-red-500'
                    : ratio >= 0.8
                    ? 'bg-amber-500'
                    : 'bg-brand-500';
                const breakdown = (Object.entries(byType) as [LeaveType, number][])
                  .filter(([, d]) => d > 0)
                  .sort((a, b) => b[1] - a[1]);
                return (
                  <tr key={emp.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                          {emp.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {emp.type}
                      </span>
                    </td>
                    {allowance === 0 ? (
                      <td className="px-5 py-3.5" colSpan={4}>
                        <span className="text-sm text-slate-400">
                          No policy ·{' '}
                          <Link
                            href="/dashboard/policies"
                            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            Set allowance
                          </Link>
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{allowance}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{used}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                              remaining === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                            )}
                          >
                            {remaining} left
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] font-medium tabular-nums text-slate-400">{used}/{allowance}</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-5 py-3.5">
                      {breakdown.length === 0 ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {breakdown.map(([t, d]) => (
                            <span
                              key={t}
                              className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', typeBadge[t])}
                            >
                              {t} · {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          {rows.length} employee{rows.length !== 1 ? 's' : ''} · Used = sum of approved leave days
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  CALENDAR PANEL
// ════════════════════════════════════════════════════════════════════════════

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS_PER_DAY = 3;

function CalendarPanel({
  month,
  onMonthChange,
  cells,
  mobileGroups,
  nameOf,
  onChipClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  cells: { date: Date | null; leaves: Leave[] }[];
  mobileGroups: { date: Date | null; leaves: Leave[] }[];
  nameOf: (id: string) => string;
  onChipClick: (id: string) => void;
}) {
  const today = startOfDay(new Date());
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const Chip = ({ leave }: { leave: Leave }) => (
    <button
      onClick={() => onChipClick(leave.id)}
      title={`${nameOf(leave.employeeId)} · ${leave.type}`}
      className={cn(
        'block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition-opacity hover:opacity-80',
        typeBadge[leave.type]
      )}
    >
      {firstName(nameOf(leave.employeeId))}
    </button>
  );

  return (
    <div className="surface overflow-hidden">
      {/* Calendar toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop / tablet: 7-column grid */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.date && startOfDay(cell.date).getTime() === today.getTime();
            const visible = cell.leaves.slice(0, MAX_CHIPS_PER_DAY);
            const extra = cell.leaves.length - visible.length;
            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[92px] border-b border-r border-slate-100 p-1.5 last-of-type:border-r-0',
                  !cell.date && 'bg-slate-50/40',
                  (idx + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                {cell.date && (
                  <>
                    <div className="mb-1 flex justify-end">
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                          isToday ? 'bg-brand-600 text-white' : 'text-slate-500'
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {visible.map((leave) => (
                        <Chip key={leave.id} leave={leave} />
                      ))}
                      {extra > 0 && (
                        <p className="px-1 text-[10px] font-medium text-slate-400">+{extra} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical list grouped by day */}
      <div className="sm:hidden">
        {mobileGroups.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarRange}
              tone="brand"
              title="No approved leave this month"
              description="Approved leaves for this month will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mobileGroups.map((cell, idx) => {
              const d = cell.date!;
              const isToday = startOfDay(d).getTime() === today.getTime();
              return (
                <li key={idx} className="px-5 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                        isToday ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cell.leaves.map((leave) => (
                      <button
                        key={leave.id}
                        onClick={() => onChipClick(leave.id)}
                        className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80', typeBadge[leave.type])}
                      >
                        {firstName(nameOf(leave.employeeId))} · {leave.type}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">Showing approved leaves · click a chip to open the request</p>
      </div>
    </div>
  );
}
