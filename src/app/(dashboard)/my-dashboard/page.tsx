'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Clock, CheckCircle2, Scale, FileText, ArrowRight,
  BookOpen, CalendarCheck, UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useLeaves } from '@/context/LeaveContext';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployeeDocs } from '@/context/EmployeeDocsContext';
import { useHandbook } from '@/context/HandbookContext';
import { useSelfEmployee } from '@/hooks/useSelfEmployee';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '../leaves/_components/shared';
import { cn } from '@/lib/utils';

/**
 * Employee home (ESS).
 *
 * Everything here is the signed-in person's own data and nothing else. The
 * server already scopes these endpoints to the caller, so this page filters
 * only to pick out what belongs on a summary — it is not the thing keeping
 * anyone's records private.
 *
 * Admin and HR reach this through "Employee view" in the profile menu, and see
 * their own record exactly as an employee would.
 */
export default function MyDashboardPage() {
  const { user } = useAuth();
  const self = useSelfEmployee();
  const { leaves, isLoading: leavesLoading } = useLeaves();
  const { records: attendance, isLoading: attendanceLoading } = useAttendance();
  const { getByEmployee } = useEmployeeDocs();
  const { getPolicy } = useHandbook();

  const email = user?.email?.toLowerCase().trim();
  const firstName = (self?.name || user?.name || user?.email?.split('@')[0] || 'there').split(' ')[0];

  // A request is theirs if it points at their employee record, or (for people
  // with no record yet) if they filed it under their own login email.
  const myLeaves = useMemo(
    () =>
      leaves.filter(
        (l) =>
          (self?.id && l.employeeId === self.id) ||
          (email && l.requesterEmail?.toLowerCase().trim() === email),
      ),
    [leaves, self?.id, email],
  );

  const pending = myLeaves.filter((l) => l.status === 'Pending');
  const approved = myLeaves.filter((l) => l.status === 'Approved');
  const usedDays = approved.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  const allowance = self ? getPolicy(self.type).annualLeaveAllowance || 0 : 0;
  const remaining = Math.max(0, allowance - usedDays);

  // Next approved leave that has not finished yet.
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return approved
      .filter((l) => (l.endDate || l.startDate) >= today)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))[0];
  }, [approved]);

  const myAttendance = useMemo(
    () => (self?.id ? attendance.filter((a) => a.employeeId === self.id) : []),
    [attendance, self?.id],
  );

  const thisMonth = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    const rows = myAttendance.filter((a) => a.date?.startsWith(prefix));
    return {
      present: rows.filter((a) => a.status === 'Present' || a.status === 'Remote').length,
      total: rows.length,
    };
  }, [myAttendance]);

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return myAttendance.find((a) => a.date === today);
  }, [myAttendance]);

  const docCount = self?.id ? getByEmployee(self.id)?.documents.length ?? 0 : 0;

  const loading = leavesLoading || attendanceLoading;

  return (
    <PageContainer>
      <PageHeader
        icon={UserRound}
        eyebrow="My portal"
        title={`Hello, ${firstName}`}
        description={
          self
            ? 'Your leave, attendance and documents at a glance.'
            : 'Your sign-in is not linked to an employee record yet, so some of this will stay empty until HR connects it.'
        }
        tone="brand"
      />

      <StatGrid cols={4}>
        <StatCard
          label="Leave remaining"
          value={self ? remaining : '—'}
          icon={Scale}
          tone="emerald"
          hint={self ? `of ${allowance} days` : 'needs an employee record'}
        />
        <StatCard label="Leave used" value={usedDays} icon={CheckCircle2} tone="brand" hint="approved this year" />
        <StatCard label="Awaiting decision" value={pending.length} icon={Clock} tone="amber" hint="requests with HR" />
        <StatCard
          label="Days marked"
          value={thisMonth.present}
          icon={CalendarCheck}
          tone="sky"
          hint={`of ${thisMonth.total} logged this month`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today + what is coming up */}
        <section className="surface space-y-4 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-slate-900">Today</h2>
            <Link href="/my-attendance" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              My attendance <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3.5',
              todayRecord ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-slate-50',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                todayRecord ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500',
              )}
            >
              <CalendarCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {todayRecord ? `Marked as ${todayRecord.status}` : 'Not marked yet'}
              </p>
              <p className="text-xs text-slate-500">
                {todayRecord?.checkIn
                  ? `Checked in at ${todayRecord.checkIn}${todayRecord.checkOut ? `, out at ${todayRecord.checkOut}` : ''}`
                  : self
                  ? 'Mark your attendance for today from My Attendance.'
                  : 'Attendance needs a linked employee record.'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[0.8667rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Upcoming leave</h3>
            {upcoming ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <CalendarDays className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{upcoming.type}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(upcoming.startDate)} to {formatDate(upcoming.endDate)} · {upcoming.days} day
                    {Number(upcoming.days) === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3.5 text-sm text-slate-500">
                Nothing booked. Approved leave shows up here.
              </p>
            )}
          </div>
        </section>

        {/* Recent requests */}
        <section className="surface space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-slate-900">My requests</h2>
            <Link href="/my-leave" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : myLeaves.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No requests yet"
              description="When you apply for leave it appears here."
            />
          ) : (
            <ul className="space-y-2">
              {myLeaves
                .slice()
                .sort((a, b) => (b.appliedDate || '').localeCompare(a.appliedDate || ''))
                .slice(0, 5)
                .map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{l.type}</p>
                      <p className="text-xs text-slate-500">{formatDate(l.startDate)} · {l.days}d</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[0.7333rem] font-semibold',
                        l.status === 'Approved' && 'bg-emerald-50 text-emerald-700',
                        l.status === 'Pending' && 'bg-amber-50 text-amber-700',
                        l.status === 'Rejected' && 'bg-red-50 text-red-700',
                      )}
                    >
                      {l.status}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      {/* Where to go next */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/my-leave" icon={CalendarDays} title="Apply for leave" description="Book time off and track its status" />
        <QuickLink
          href="/my-documents"
          icon={FileText}
          title="My documents"
          description={docCount > 0 ? `${docCount} file${docCount === 1 ? '' : 's'} shared with you` : 'Payslips and letters from HR'}
        />
        <QuickLink href="/handbook" icon={BookOpen} title="Handbook" description="Company policies and procedures" />
      </div>
    </PageContainer>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="surface group flex items-center gap-3.5 p-4 transition-shadow hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="truncate text-xs text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </Link>
  );
}
