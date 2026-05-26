'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck, Plus, Pencil, Trash2, Search,
  Home, XCircle, CheckCircle2, Percent, LogIn, LogOut
} from 'lucide-react';
import AttendanceModal from '@/components/dashboard/AttendanceModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { cn } from '@/lib/utils';
import { resolveName } from '@/lib/names';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

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

export default function AttendancePage() {
  const { records, isLoading, deleteAttendance } = useAttendance();
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

  const handleDelete = (e: React.MouseEvent, attendance: Attendance) => {
    e.stopPropagation();
    setDeleteState({ attendance, isDeleting: false });
  };

  const confirmDelete = async () => {
    const attendance = deleteState.attendance;
    if (!attendance) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteAttendance(attendance.id);
      toast.success('Attendance deleted', `${nameOf(attendance.employeeId)}'s record has been removed.`);
      setDeleteState({ attendance: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete attendance', err instanceof Error ? err.message : 'Please try again.');
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
      {/* Header */}
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

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Present" value={presentCount} icon={CheckCircle2} tone="emerald" hint={dateFilter ? 'on selected date' : 'all records'} />
        <StatCard label="Remote" value={remoteCount} icon={Home} tone="sky" hint={dateFilter ? 'on selected date' : 'all records'} />
        <StatCard label="Absent" value={absentCount} icon={XCircle} tone="red" hint={dateFilter ? 'on selected date' : 'all records'} />
        <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={Percent} tone="brand" hint={`${statScope.length} record${statScope.length !== 1 ? 's' : ''}`} />
      </StatGrid>

      {/* Table card */}
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
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarCheck}
              tone="default"
              title={searchQuery || statusFilter !== 'all' || dateFilter ? 'No attendance matches your filters' : 'No attendance recorded yet'}
              description={searchQuery || statusFilter !== 'all' || dateFilter ? 'Try a different date, status, or clear filters.' : 'Mark your first attendance entry to start tracking.'}
              action={
                !(searchQuery || statusFilter !== 'all' || dateFilter) ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" /> Mark Attendance
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Employee', 'Date', 'Status', 'Check-in', 'Check-out', 'Note', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const name = nameOf(record.employeeId);
                  const badge = statusBadge[record.status];
                  return (
                    <tr
                      key={record.id ?? idx}
                      className="group border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                            {name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{record.date}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', badge.bg, badge.text, badge.ring)}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {record.checkIn
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><LogIn className="h-3.5 w-3.5 text-slate-300" />{record.checkIn}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {record.checkOut
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><LogOut className="h-3.5 w-3.5 text-slate-300" />{record.checkOut}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {record.note
                          ? <span className="block max-w-[180px] truncate text-sm text-slate-600" title={record.note}>{record.note}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => setModalState({ isOpen: true, mode: 'edit', attendance: record })}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, record)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
            {filtered.length} of {validRecords.length} record{validRecords.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

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
