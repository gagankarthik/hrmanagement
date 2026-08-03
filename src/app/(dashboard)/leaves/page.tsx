'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Plus, Pencil, Trash2, Search, Check, X, Eye,
  Clock, CheckCircle2, XCircle, Layers, Inbox, Scale, CalendarRange, CalendarCheck,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import AttendancePage from '@/app/(dashboard)/attendance/page';
import AttendanceModal from '@/components/dashboard/AttendanceModal';
import { ActionMenu } from '@/components/ui/action-menu';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { useHandbook } from '@/context/HandbookContext';
import { Leave, LeaveStatus, LeaveType } from '@/types/leave';
import { resolveName } from '@/lib/names';
import { friendlyError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { exportToCsv } from '@/lib/export';
import { STATUS_FILTERS, TYPE_FILTERS, statusBadge, typeBadge, formatDate, leaveCoversDay } from './_components/shared';
import { BalancesPanel } from './_components/BalancesPanel';
import { CalendarPanel } from './_components/CalendarPanel';
import { Avatar } from '@/components/ui/avatar';

type TabKey = 'requested' | 'balances' | 'calendar' | 'attendance';
type EmployeeScope = 'active' | 'all';

const SCOPE_OPTIONS: { value: EmployeeScope; label: string }[] = [
  { value: 'active', label: 'Active employees' },
  { value: 'all', label: 'All employees' },
];

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'requested', label: 'Requested', icon: Inbox },
  { key: 'balances', label: 'Balances', icon: Scale },
  { key: 'calendar', label: 'Calendar', icon: CalendarRange },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
];

export default function LeavesPage() {
  const { leaves, isLoading, error, updateLeave, deleteLeave, fetchLeaves } = useLeaves();
  const { employees } = useEmployees();
  const { getPolicy } = useHandbook();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('requested');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveType>('all');
  // Leave management is about the current workforce, so terminated employees
  // (and their requests) are hidden by default. "All employees" brings them back.
  const [empScope, setEmpScope] = useState<EmployeeScope>('active');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [deleteState, setDeleteState] = useState<{ leave: Leave | null; isDeleting: boolean }>({
    leave: null, isDeleting: false,
  });
  const [decision, setDecision] = useState<{ leave: Leave; status: LeaveStatus } | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const toast = useToast();

  const allLeaves = leaves.filter((l) => l && l.id);

  // Employees in scope, and the request set that belongs to them. Requests with
  // no employee record (ESS users) or an unknown id are always kept so nothing
  // silently disappears from the approval queue.
  const scopedEmployees = useMemo(
    () => (empScope === 'all' ? employees : employees.filter((e) => e.status !== 'Terminated')),
    [employees, empScope]
  );

  const terminatedIds = useMemo(
    () => new Set(employees.filter((e) => e.status === 'Terminated').map((e) => e.id)),
    [employees]
  );

  const validLeaves = useMemo(
    () => (empScope === 'all' ? allLeaves : allLeaves.filter((l) => !l.employeeId || !terminatedIds.has(l.employeeId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allLeaves, empScope, terminatedIds]
  );

  const hiddenCount = allLeaves.length - validLeaves.length;
  const isFiltered =
    Boolean(searchQuery) || statusFilter !== 'all' || typeFilter !== 'all' || (empScope === 'active' && hiddenCount > 0);

  const nameOf = (employeeId: string) => resolveName(employeeId, employees, { unknown: 'Unknown employee' });
  // Self-service (ESS) requests may have no employeeId — fall back to the
  // requester name captured at submission so HR always sees who applied.
  const labelFor = (l: Leave) => (l.requesterName?.trim() || nameOf(l.employeeId));

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return validLeaves.filter((l) => {
      const matchSearch = !q || labelFor(l).toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchType = typeFilter === 'all' || l.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validLeaves, employees, searchQuery, statusFilter, typeFilter]);

  const handleExport = () => {
    exportToCsv('leave-requests', filtered as unknown as Record<string, unknown>[], [
      { key: 'employeeId', label: 'Employee', value: (l) => labelFor(l as unknown as Leave) },
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
    return scopedEmployees
      .filter((emp) => !q || emp.name?.toLowerCase().includes(q))
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
  }, [scopedEmployees, approvedLeaves, searchQuery, getPolicy]);

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

  const leaveColumns: DataTableColumn<Leave>[] = [
    {
      id: 'employee',
      header: 'Employee',
      sortValue: (l) => labelFor(l).toLowerCase(),
      cell: (l) => {
        const name = labelFor(l);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <p className="text-sm font-semibold text-slate-900">{name || 'Unknown'}</p>
          </div>
        );
      },
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (l) => l.type,
      cell: (l) => (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[l.type])}>{l.type}</span>
      ),
    },
    {
      id: 'dates',
      header: 'Dates',
      sortValue: (l) => l.startDate,
      cell: (l) => (
        <span className="whitespace-nowrap">{formatDate(l.startDate)} <span className="text-slate-300">→</span> {formatDate(l.endDate)}</span>
      ),
    },
    {
      id: 'days',
      header: 'Days',
      sortValue: (l) => Number(l.days) || 0,
      hideBelow: 'sm',
      cell: (l) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {l.days} {l.days === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (l) => l.status,
      cell: (l) => {
        const badge = statusBadge[l.status];
        const StatusIcon = badge.icon;
        return (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', badge.cls)}>
            <StatusIcon className="h-3 w-3" />
            {l.status}
          </span>
        );
      },
    },
  ];

  const confirmDelete = async () => {
    const leave = deleteState.leave;
    if (!leave) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteLeave(leave.id);
      toast.success('Leave request deleted', `${labelFor(leave)}'s request has been removed.`);
      setDeleteState({ leave: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete leave request', friendlyError(err));
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
        `${labelFor(decision.leave)}'s request has been ${decision.status.toLowerCase()}.`
      );
      setDecision(null);
    } catch (err) {
      toast.error('Could not update leave request', friendlyError(err));
    } finally {
      setDeciding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        icon={CalendarDays}
        eyebrow="Time & Leave"
        title="Leave Management"
        description="Track and approve employee leave requests"
        tone="brand"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="btn-ghost"
            >
              <CalendarCheck className="h-4 w-4" /> Add Attendance
            </button>
            <button
              onClick={() => router.push('/leaves/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Apply Leave
            </button>
          </div>
        }
      />

      {/* Leave-request stats — hidden on the Attendance tab, which shows its own. */}
      {activeTab !== 'attendance' && (
        <StatGrid cols={4}>
          <StatCard label="Pending" value={totalPending} icon={Clock} tone="amber" hint="awaiting review" />
          <StatCard label="Approved" value={totalApproved} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Rejected" value={totalRejected} icon={XCircle} tone="red" />
          <StatCard
            label="Total requests"
            value={validLeaves.length}
            icon={Layers}
            tone="slate"
            hint={empScope === 'active' ? 'active employees' : 'all on record'}
          />
        </StatGrid>
      )}

      {/* Tab switcher (segmented control) — scrolls horizontally instead of
          squeezing labels when all four tabs don't fit. The workforce scope
          sits alongside it because it applies to every leave tab. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-display text-sm font-semibold transition-all sm:px-4',
                    active
                      ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/[0.04]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  aria-pressed={active}
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab !== 'attendance' && (
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Workforce scope"
              value={empScope}
              onChange={setEmpScope}
              options={SCOPE_OPTIONS}
            />
            {empScope === 'active' && hiddenCount > 0 && (
              <span className="whitespace-nowrap text-xs text-slate-400">
                {hiddenCount} hidden
              </span>
            )}
          </div>
        )}
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
              <FilterSelect
                label="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'all' ? 'All statuses' : s }))}
              />
              <FilterSelect
                label="Filter by type"
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPE_FILTERS.map((t) => ({ value: t, label: t === 'all' ? 'All types' : t }))}
              />
            </div>
          </div>

          <DataTable<Leave>
            columns={leaveColumns}
            data={filtered}
            getRowId={(l) => l.id}
            caption="Leave requests"
            error={error}
            onRetry={fetchLeaves}
            onRowClick={(l) => router.push(`/leaves/${l.id}`)}
            minWidth="min-w-[760px]"
            tableId="leaves"
            initialSort={{ columnId: 'dates', dir: 'desc' }}
            rowActions={(leave) => (
              <div className="flex items-center gap-1">
                {leave.status === 'Pending' && (
                  <div className="flex items-center gap-0.5">
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
                    { label: 'View details', icon: Eye, onClick: () => router.push(`/leaves/${leave.id}`) },
                    { label: 'Edit request', icon: Pencil, onClick: () => router.push(`/leaves/${leave.id}/edit`) },
                    { label: 'Delete request', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ leave, isDeleting: false }) },
                  ]}
                />
              </div>
            )}
            empty={{
              icon: CalendarDays,
              tone: 'brand',
              title: isFiltered ? 'No leave requests match your filters' : 'No leave requests yet',
              description: isFiltered
                ? empScope === 'active' && hiddenCount > 0
                  ? 'Try different keywords, or switch to All employees to include terminated staff.'
                  : 'Try different keywords or clear filters.'
                : 'Apply for leave to start tracking time off.',
              action: !isFiltered ? (
                <button onClick={() => router.push('/leaves/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Apply Leave
                </button>
              ) : undefined,
            }}
          />

          {filtered.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {filtered.length} of {validLeaves.length} request{validLeaves.length !== 1 ? 's' : ''}
                {empScope === 'active' && hiddenCount > 0 && (
                  <>
                    {' · '}
                    <button
                      onClick={() => setEmpScope('all')}
                      className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Show {hiddenCount} from terminated employees
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
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
          onChipClick={(id) => router.push(`/leaves/${id}`)}
        />
      )}

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === 'attendance' && <AttendancePage embedded />}

      <ConfirmDialog
        isOpen={deleteState.leave !== null}
        onClose={() => setDeleteState({ leave: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Leave Request"
        description={
          deleteState.leave ? (
            <>
              Are you sure you want to delete the leave request for{' '}
              <span className="font-semibold text-slate-900">{labelFor(deleteState.leave)}</span>?
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
              <span className="font-semibold text-slate-900">{labelFor(decision.leave)}</span>{' '}
              ({decision.leave.days} {decision.leave.days === 1 ? 'day' : 'days'})?
            </>
          ) : null
        }
        confirmLabel={decision?.status === 'Approved' ? 'Approve' : 'Reject'}
        isLoading={deciding}
      />

      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        mode="create"
      />
    </PageContainer>
  );
}
