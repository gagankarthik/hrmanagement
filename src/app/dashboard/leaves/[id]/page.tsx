'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Check, X, Clock, CheckCircle2, XCircle,
  CalendarDays, CalendarRange, Hourglass, Paperclip, User,
} from 'lucide-react';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { resolveName } from '@/lib/names';
import { cn } from '@/lib/utils';
import LeaveModal from '@/components/dashboard/LeaveModal';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useToast } from '@/components/ui/toast';
import { UploadedDoc } from '@/types/uploads';
import { LeaveStatus, LeaveType } from '@/types/leave';

interface PageProps { params: Promise<{ id: string }> }

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

function fmt(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function LeaveDetailContent({ params }: PageProps) {
  const router = useRouter();
  const { leaves, isLoading, updateLeave, deleteLeave } = useLeaves();
  const { employees } = useEmployees();
  const toast = useToast();

  const [leaveId, setLeaveId] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [acting, setActing] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);

  React.useEffect(() => { params.then((p) => setLeaveId(p.id)); }, [params]);

  const leave = useMemo(() => leaves.find((l) => l.id === leaveId), [leaves, leaveId]);
  const name = leave ? resolveName(leave.employeeId, employees, { unknown: 'Unknown employee' }) : '';

  const decide = async (status: LeaveStatus) => {
    if (!leave) return;
    setActing(true);
    try {
      await updateLeave(leave.id, { status });
      toast.success(status === 'Approved' ? 'Leave approved' : 'Leave rejected', `${name}'s request has been ${status.toLowerCase()}.`);
    } catch (err) {
      toast.error('Could not update request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActing(false);
    }
  };

  const saveDocs = async (docs: UploadedDoc[]) => {
    if (!leave) return;
    setSavingDocs(true);
    try {
      await updateLeave(leave.id, { documents: docs });
    } catch (err) {
      toast.error('Could not save attachments', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingDocs(false);
    }
  };

  const confirmDelete = async () => {
    if (!leave) return;
    setIsDeleting(true);
    try {
      await deleteLeave(leave.id);
      toast.success('Leave request deleted', `${name}'s request has been removed.`);
      router.push('/dashboard/leaves');
    } catch (err) {
      toast.error('Failed to delete request', err instanceof Error ? err.message : 'Please try again.');
      setIsDeleting(false);
    }
  };

  if (isLoading && !leave) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!leave) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Leave request not found"
        description="It may have been deleted, or the link is invalid."
        className="mt-12"
        action={
          <button onClick={() => router.push('/dashboard/leaves')} className="btn-primary">Back to Leaves</button>
        }
      />
    );
  }

  const badge = statusBadge[leave.status];
  const StatusIcon = badge.icon;

  return (
    <div className="space-y-6">
      {/* Nav + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.push('/dashboard/leaves')}
          className="flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-white hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leaves
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="btn-ghost">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="surface p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-sm">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[leave.type])}>
                  {leave.type}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', badge.cls)}>
                  <StatusIcon className="h-3 w-3" /> {leave.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={CalendarDays} label="Start date" value={fmt(leave.startDate)} />
          <Fact icon={CalendarRange} label="End date" value={fmt(leave.endDate)} />
          <Fact icon={Hourglass} label="Duration" value={`${leave.days} ${leave.days === 1 ? 'day' : 'days'}`} />
          <Fact icon={Clock} label="Applied" value={fmt(leave.appliedDate)} />
        </div>
      </div>

      {/* Pending decision */}
      {leave.status === 'Pending' && (
        <div className="surface flex flex-col gap-3 border-l-4 border-l-amber-400 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-slate-700">This request is awaiting your review.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => decide('Approved')} disabled={acting} className="btn-primary">
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => decide('Rejected')}
              disabled={acting}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="surface p-5">
        <div className="mb-2 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <h2 className="font-display text-base font-bold text-slate-900">Reason</h2>
        </div>
        <p className="text-sm text-slate-600">{leave.reason?.trim() || <span className="text-slate-400">No reason provided.</span>}</p>
      </div>

      {/* Attachments */}
      <div className="surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-slate-400" />
            <h2 className="font-display text-base font-bold text-slate-900">Attachments</h2>
          </div>
          {savingDocs && <span className="text-xs text-slate-400">Saving…</span>}
        </div>
        <DocumentUploader value={leave.documents || []} onChange={saveDocs} folder="leaves" label="" />
      </div>

      <LeaveModal isOpen={editOpen} onClose={() => setEditOpen(false)} mode="edit" leave={leave} />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Leave Request"
        description={
          <>
            Are you sure you want to delete the leave request for{' '}
            <span className="font-semibold text-slate-900">{name}</span>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete Request"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function LeaveDetailPage(props: PageProps) {
  return (
    <ErrorBoundary>
      <LeaveDetailContent {...props} />
    </ErrorBoundary>
  );
}
