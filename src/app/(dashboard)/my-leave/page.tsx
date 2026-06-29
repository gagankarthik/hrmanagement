'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Plus, Clock, CheckCircle2, Scale, Layers, X,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useLeaves } from '@/context/LeaveContext';
import { useHandbook } from '@/context/HandbookContext';
import { useSelfEmployee } from '@/hooks/useSelfEmployee';
import { useAuth } from '@/context/AuthContext';
import { Leave, LeaveType } from '@/types/leave';
import { cn } from '@/lib/utils';
import { statusBadge, typeBadge, formatDate } from '../leaves/_components/shared';

/**
 * Self-service leave portal (ESS) for recruiter / sales users. Requests are
 * keyed to the signed-in user's login email, so it works whether or not they
 * have an employee record. If a matching employee profile exists we also show
 * their leave balance from the policy framework.
 */
export default function MyLeavePage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const self = useSelfEmployee();
  const { leaves, isLoading, deleteLeave } = useLeaves();
  const { getPolicy } = useHandbook();

  const email = user?.email?.toLowerCase().trim();
  const displayName = self?.name || user?.name || user?.email?.split('@')[0] || 'there';

  const [cancelState, setCancelState] = useState<{ leave: Leave | null; isDeleting: boolean }>({
    leave: null, isDeleting: false,
  });

  // This user's requests — matched by login email (ESS) or, if they happen to
  // have an employee record, by that id too. Newest first.
  const myLeaves = useMemo(() => {
    return leaves
      .filter((l) => {
        if (!l || !l.id) return false;
        const byEmail = email && l.requesterEmail?.toLowerCase().trim() === email;
        const byEmployee = self && l.employeeId && l.employeeId === self.id;
        return byEmail || byEmployee;
      })
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  }, [leaves, email, self]);

  const pending = myLeaves.filter((l) => l.status === 'Pending').length;
  const approved = myLeaves.filter((l) => l.status === 'Approved');
  const used = approved.reduce((sum, l) => sum + (Number(l.days) || 0), 0);

  // Balance is only known when we can find an employee profile (policy allowance).
  const allowance = self ? getPolicy(self.type).annualLeaveAllowance || 0 : 0;
  const hasBalance = allowance > 0;
  const remaining = Math.max(0, allowance - used);

  const confirmCancel = async () => {
    const leave = cancelState.leave;
    if (!leave) return;
    setCancelState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteLeave(leave.id);
      toast.success('Request cancelled', 'Your leave request has been withdrawn.');
      setCancelState({ leave: null, isDeleting: false });
    } catch (err) {
      toast.error('Could not cancel request', err instanceof Error ? err.message : 'Please try again.');
      setCancelState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={CalendarDays}
        eyebrow="Time & Leave"
        title="My Leave"
        description={`Apply for and track your time off, ${displayName.split(' ')[0]}`}
        tone="brand"
        actions={
          <button onClick={() => router.push('/my-leave/new')} className="btn-primary">
            <Plus className="h-4 w-4" /> Apply Leave
          </button>
        }
      />

      <StatGrid cols={3}>
        {hasBalance ? (
          <StatCard label="Remaining" value={remaining} icon={Scale} tone="emerald" hint={`of ${allowance} days`} />
        ) : (
          <StatCard label="Total requests" value={myLeaves.length} icon={Layers} tone="slate" hint="all on record" />
        )}
        <StatCard label="Used" value={used} icon={CheckCircle2} tone="brand" hint="approved this year" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" hint="awaiting review" />
      </StatGrid>

      <div className="surface">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-bold text-slate-900">My requests</h2>
        </div>

        {myLeaves.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarDays}
              tone="brand"
              title="No leave requests yet"
              description="Apply for leave to start tracking your time off."
              action={
                <button onClick={() => router.push('/my-leave/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Apply Leave
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Type', 'Dates', 'Days', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((leave) => {
                  const badge = statusBadge[leave.status];
                  const StatusIcon = badge.icon;
                  return (
                    <tr key={leave.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[leave.type as LeaveType])}>
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
                      <td className="px-5 py-3.5 text-right">
                        {leave.status === 'Pending' && (
                          <button
                            onClick={() => setCancelState({ leave, isDeleting: false })}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {myLeaves.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">{myLeaves.length} request{myLeaves.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelState.leave !== null}
        onClose={() => setCancelState({ leave: null, isDeleting: false })}
        onConfirm={confirmCancel}
        title="Cancel Leave Request"
        tone="danger"
        description={
          cancelState.leave ? (
            <>Withdraw your {cancelState.leave.type.toLowerCase()} leave request for{' '}
              <span className="font-semibold text-slate-900">{cancelState.leave.days} {cancelState.leave.days === 1 ? 'day' : 'days'}</span>? This cannot be undone.</>
          ) : null
        }
        confirmLabel="Cancel Request"
        isLoading={cancelState.isDeleting}
      />
    </PageContainer>
  );
}
