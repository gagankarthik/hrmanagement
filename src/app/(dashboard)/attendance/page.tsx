'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck, CalendarDays, Plus, Pencil, Trash2, Search,
  Home, XCircle, CheckCircle2, Percent, LogIn, LogOut, Timer, UserRoundX
} from 'lucide-react';
import AttendanceModal from '@/components/dashboard/AttendanceModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { cn } from '@/lib/utils';
import { resolveName } from '@/lib/names';
import { friendlyError } from '@/lib/errors';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ActionMenu } from '@/components/ui/action-menu';
import { FilterSelect } from '@/components/ui/filter-select';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { AttendanceCalendar, rollUpDay } from '@/components/dashboard/AttendanceCalendar';
import { formatDate } from '@/lib/format';
import { Avatar } from '@/components/ui/avatar';

const STATUS_FILTERS: ('all' | AttendanceStatus)[] = ['all', 'Present', 'Remote', 'Half-day', 'Absent', 'Leave'];

const statusBadge: Record<AttendanceStatus, { bg: string; text: string; ring: string }> = {
  Present: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  Remote: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  'Half-day': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  Absent: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200' },
  Leave: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage({ embedded = false }: { embedded?: boolean }) {
  const { records, isLoading, error, deleteAttendance, fetchAttendance } = useAttendance();
  const { employees } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [dateFilter, setDateFilter] = useState<string>(todayISO());
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; attendance?: Attendance }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ attendance: Attendance | null; isDeleting: boolean }>({
    attendance: null, isDeleting: false,
  });
  const toast = useToast();

  const validRecords = useMemo(() => records.filter((r) => r && r.id), [records]);

  const nameOf = (employeeId: string) => resolveName(employeeId, employees, { unknown: 'Unknown employee' });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return validRecords.filter((r) => {
      const matchSearch = !q || nameOf(r.employeeId).toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchDate = !dateFilter || r.date === dateFilter;
      return matchSearch && matchStatus && matchDate;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRecords, searchQuery, statusFilter, dateFilter, employees]);

  // Stats — computed over the records matching the active date filter (or all when cleared).
  const statScope = useMemo(
    () => (dateFilter ? validRecords.filter((r) => r.date === dateFilter) : validRecords),
    [validRecords, dateFilter]
  );
  const presentCount = statScope.filter((r) => r.status === 'Present').length;
  const remoteCount = statScope.filter((r) => r.status === 'Remote').length;
  const absentCount = statScope.filter((r) => r.status === 'Absent').length;
  const halfCount = statScope.filter((r) => r.status === 'Half-day').length;
  const attendanceRate = statScope.length
    ? Math.round(((presentCount + remoteCount + halfCount) / statScope.length) * 100)
    : 0;

  /**
   * Clock state for the scope in view.
   *
   * `stillIn` is the one worth watching: someone checked in and never checked
   * out. On today's date that is simply people still at work; on a past date it
   * is a missing check-out somebody has to correct, which is why the hint below
   * says which of the two it is rather than leaving it ambiguous.
   */
  const clock = useMemo(() => rollUpDay(statScope), [statScope]);
  const isToday = dateFilter === todayISO();
  /** Employees with no record at all on the selected day. */
  const unrecorded = dateFilter ? Math.max(0, employees.length - statScope.length) : 0;

  // Month view state. Defaults to the month of the selected day so switching
  // views never jumps somewhere unrelated.
  const [view, setView] = useState<'day' | 'month'>('day');
  const [cursor, setCursor] = useState(() => {
    const base = dateFilter || todayISO();
    return { year: Number(base.slice(0, 4)), month: Number(base.slice(5, 7)) - 1 };
  });

  const monthRecords = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;
    return validRecords.filter((r) => r.date?.startsWith(prefix));
  }, [validRecords, cursor]);

  const attendanceColumns: DataTableColumn<Attendance>[] = [
    {
      id: 'employee',
      header: 'Employee',
      sortValue: (r) => nameOf(r.employeeId).toLowerCase(),
      cell: (r) => {
        const name = nameOf(r.employeeId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <p className="text-sm font-semibold text-slate-900">{name}</p>
          </div>
        );
      },
    },
    {
      id: 'date',
      header: 'Date',
      sortValue: (r) => r.date,
      cell: (r) => formatDate(r.date),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      cell: (r) => {
        const badge = statusBadge[r.status];
        return (
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', badge.bg, badge.text, badge.ring)}>
            {r.status}
          </span>
        );
      },
    },
    {
      id: 'checkIn',
      header: 'Check-in',
      hideBelow: 'md',
      cell: (r) => r.checkIn
        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><LogIn className="h-3.5 w-3.5 text-slate-400" />{r.checkIn}</span>
        : <span className="text-sm text-slate-400">—</span>,
    },
    {
      id: 'checkOut',
      header: 'Check-out',
      hideBelow: 'md',
      cell: (r) => r.checkOut
        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><LogOut className="h-3.5 w-3.5 text-slate-400" />{r.checkOut}</span>
        : <span className="text-sm text-slate-400">—</span>,
    },
    {
      id: 'note',
      header: 'Note',
      hideBelow: 'lg',
      cell: (r) => r.note
        ? <span className="block max-w-[180px] truncate text-sm text-slate-600" title={r.note}>{r.note}</span>
        : <span className="text-sm text-slate-400">—</span>,
    },
  ];

  const confirmDelete = async () => {
    const attendance = deleteState.attendance;
    if (!attendance) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteAttendance(attendance.id);
      toast.success('Attendance deleted', `${nameOf(attendance.employeeId)}'s record has been removed.`);
      setDeleteState({ attendance: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete attendance', friendlyError(err));
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded && (
      <PageHeader
        icon={CalendarCheck}
        eyebrow="Time & Leave"
        title="Attendance"
        description="Record and review daily attendance"
        tone="brand"
        actions={
          <button
            onClick={() => setModalState({ isOpen: true, mode: 'create' })}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Mark Attendance
          </button>
        }
      />
      )}

      {embedded && (
        <div className="flex justify-end">
          <button onClick={() => setModalState({ isOpen: true, mode: 'create' })} className="btn-primary">
            <Plus className="h-4 w-4" /> Mark Attendance
          </button>
        </div>
      )}

      {/* Stats — hidden in embedded mode so the host page's common KPI strip is the single source */}
      {!embedded && (
        <>
          <StatGrid cols={4}>
            <StatCard
              label="Clocked in"
              value={clock.clockedIn}
              icon={LogIn}
              tone="emerald"
              hint={dateFilter ? 'check-in recorded' : 'across all records'}
            />
            <StatCard
              label="Clocked out"
              value={clock.clockedOut}
              icon={LogOut}
              tone="sky"
              hint="in and out recorded"
            />
            <StatCard
              label={isToday ? 'Still in' : 'No clock-out'}
              value={clock.stillIn}
              icon={Timer}
              tone={clock.stillIn > 0 && !isToday ? 'amber' : 'slate'}
              hint={isToday ? 'no check-out yet' : 'missing a check-out'}
            />
            <StatCard
              label="Not recorded"
              value={dateFilter ? unrecorded : '—'}
              icon={UserRoundX}
              tone={unrecorded > 0 ? 'red' : 'slate'}
              hint={dateFilter ? `of ${employees.length} employees` : 'pick a date'}
            />
          </StatGrid>

          <StatGrid cols={4}>
            <StatCard label="Present" value={presentCount} icon={CheckCircle2} tone="emerald" hint={dateFilter ? 'on selected date' : 'all records'} />
            <StatCard label="Remote" value={remoteCount} icon={Home} tone="sky" hint={dateFilter ? 'on selected date' : 'all records'} />
            <StatCard label="Absent" value={absentCount} icon={XCircle} tone="red" hint={dateFilter ? 'on selected date' : 'all records'} />
            <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={Percent} tone="brand" hint={`${statScope.length} record${statScope.length !== 1 ? 's' : ''}`} />
          </StatGrid>

          <div className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 pt-3">
              <Tabs
                ariaLabel="Attendance view"
                value={view}
                onChange={setView}
                items={[
                  { value: 'day' as const, label: 'Day', icon: CalendarCheck },
                  { value: 'month' as const, label: 'Month', icon: CalendarDays, count: monthRecords.length },
                ]}
              />
            </div>

            {view === 'month' && (
              <AttendanceCalendar
                year={cursor.year}
                month={cursor.month}
                records={monthRecords}
                selectedDate={dateFilter}
                onMonthChange={(year, month) => setCursor({ year, month })}
                onSelectDate={(date) => {
                  // Picking a day is a drill-down, so follow it into day view
                  // rather than leaving the person to find the switch.
                  setDateFilter(date);
                  setView('day');
                }}
              />
            )}

            {view === 'day' && (
              <p className="px-5 py-3.5 text-sm text-slate-500">
                {dateFilter
                  ? `Showing ${filtered.length} record${filtered.length === 1 ? '' : 's'} for ${formatDate(dateFilter)}.`
                  : 'Showing every record. Pick a date below to focus on one day.'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Table card. Hidden while the month grid is up: the two answer the same
          question at different resolutions, and showing both makes the page
          scroll past a calendar to reach a table filtered to one day. Embedded
          hosts render no view switcher, so they always get the table. */}
      {(embedded || view === 'day') && (
      <div className="surface">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                Clear date
              </button>
            )}
          </div>
          <FilterSelect
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'all' ? 'All statuses' : s }))}
          />
        </div>

        <DataTable<Attendance>
          columns={attendanceColumns}
          data={filtered}
          getRowId={(r) => r.id}
          caption="Attendance records"
          error={error}
          onRetry={fetchAttendance}
          minWidth="min-w-[800px]"
          tableId="attendance"
          initialSort={{ columnId: 'date', dir: 'desc' }}
          rowActions={(record) => (
            <ActionMenu
              items={[
                { label: 'Edit record', icon: Pencil, onClick: () => setModalState({ isOpen: true, mode: 'edit', attendance: record }) },
                { label: 'Delete record', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ attendance: record, isDeleting: false }) },
              ]}
            />
          )}
          empty={{
            icon: CalendarCheck,
            title: searchQuery || statusFilter !== 'all' || dateFilter ? 'No attendance matches your filters' : 'No attendance recorded yet',
            description: searchQuery || statusFilter !== 'all' || dateFilter ? 'Try a different date, status, or clear filters.' : 'Mark your first attendance entry to start tracking.',
            action: !(searchQuery || statusFilter !== 'all' || dateFilter) ? (
              <button onClick={() => setModalState({ isOpen: true, mode: 'create' })} className="btn-primary">
                <Plus className="h-4 w-4" /> Mark Attendance
              </button>
            ) : undefined,
          }}
        />

        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              {filtered.length} of {validRecords.length} record{validRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
      )}

      <AttendanceModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        attendance={modalState.attendance}
      />

      <ConfirmDialog
        isOpen={deleteState.attendance !== null}
        onClose={() => setDeleteState({ attendance: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Attendance"
        description={
          deleteState.attendance ? (
            <>
              Are you sure you want to delete the attendance record for{' '}
              <span className="font-semibold text-slate-900">{nameOf(deleteState.attendance.employeeId)}</span>
              {' '}on {deleteState.attendance.date}? This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Attendance"
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}
