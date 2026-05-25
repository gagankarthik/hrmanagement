'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Plus, Pencil, Trash2, Search, Check, X,
  Clock, CheckCircle2, XCircle, Layers,
} from 'lucide-react';
import LeaveModal from '@/components/dashboard/LeaveModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Leave, LeaveStatus, LeaveType } from '@/types/leave';
import { resolveName } from '@/lib/names';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

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

export default function LeavesPage() {
  const { leaves, isLoading, updateLeave, deleteLeave } = useLeaves();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveType>('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; leave?: Leave }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ leave: Leave | null; isDeleting: boolean }>({
    leave: null, isDeleting: false,
  });
  const [decision, setDecision] = useState<{ leave: Leave; status: LeaveStatus } | null>(null);
  const [deciding, setDeciding] = useState(false);
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

  const totalPending = validLeaves.filter((l) => l.status === 'Pending').length;
  const totalApproved = validLeaves.filter((l) => l.status === 'Approved').length;
  const totalRejected = validLeaves.filter((l) => l.status === 'Rejected').length;

  const handleDelete = (e: React.MouseEvent, leave: Leave) => {
    e.stopPropagation();
    setDeleteState({ leave, isDeleting: false });
  };

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
            onClick={() => setModalState({ isOpen: true, mode: 'create' })}
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

      {/* Table card */}
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
          <div className="flex flex-wrap gap-3">
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
                    onClick={() => setModalState({ isOpen: true, mode: 'create' })}
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
                {filtered.map((leave, idx) => {
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
                        <div className="flex items-center justify-end gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          {leave.status === 'Pending' && (
                            <>
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
                            </>
                          )}
                          <button
                            onClick={() => setModalState({ isOpen: true, mode: 'edit', leave })}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, leave)}
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
            {filtered.length} of {validLeaves.length} request{validLeaves.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <LeaveModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        leave={modalState.leave}
      />

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
