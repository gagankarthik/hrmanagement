'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, LogIn, LogOut, Clock, Home, CheckCircle2, Timer,
  ShieldCheck, Briefcase, MapPin, UserRound, ArrowRight, CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAttendance } from '@/context/AttendanceContext';
import { useLeaves } from '@/context/LeaveContext';
import { useAuth } from '@/context/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { useSelfEmployee } from '@/hooks/useSelfEmployee';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { friendlyError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { leaveCoversDay } from '../leaves/_components/shared';

/** Work modes a person can clock in under. Absent / Leave stay with HR. */
const WORK_MODES: { value: AttendanceStatus; label: string; icon: React.ElementType }[] = [
  { value: 'Present', label: 'In office', icon: CalendarCheck },
  { value: 'Remote', label: 'Remote', icon: Home },
  { value: 'Half-day', label: 'Half day', icon: Timer },
];

const statusBadge: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Remote: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Half-day': 'bg-amber-50 text-amber-700 ring-amber-200',
  Absent: 'bg-red-50 text-red-600 ring-red-200',
  Leave: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Current wall-clock time as the "HH:MM" the rest of the module stores. */
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toMinutes(value?: string): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes between check-in and check-out, rolling past midnight if needed. */
function workedMinutes(checkIn?: string, checkOut?: string): number | null {
  const start = toMinutes(checkIn);
  const end = toMinutes(checkOut);
  if (start === null || end === null) return null;
  const diff = end - start;
  return diff < 0 ? diff + 24 * 60 : diff;
}

function fmtDuration(mins: number | null): string {
  if (mins === null) return '—';
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

/** "09:05" → "9:05 AM" for display; the stored value stays 24h. */
function fmtTime(value?: string): string {
  const mins = toMinutes(value);
  if (mins === null) return '—';
  const h24 = Math.floor(mins / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/**
 * Self-service attendance (ESS). The signed-in user clocks in and out for
 * themselves and sees only their own record — resolved from their login email
 * via useSelfEmployee. What the page shows adapts to who they are: people with
 * no linked employee profile get an explanation instead of a dead button, and
 * admin/HR also get a way through to the full attendance console.
 */
export default function MyAttendancePage() {
  const { user } = useAuth();
  const { fullAccess, roleLabel } = useAccess();
  const self = useSelfEmployee();
  const { records, isLoading, createAttendance, updateAttendance } = useAttendance();
  const { leaves } = useLeaves();
  const toast = useToast();

  const [mode, setMode] = useState<AttendanceStatus>('Present');
  const [busy, setBusy] = useState<'in' | 'out' | null>(null);
  // Rendered only after mount so the server and client never disagree on time.
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    setClock(nowTime());
    const t = setInterval(() => setClock(nowTime()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = todayISO();
  const displayName = self?.name || user?.name || user?.email?.split('@')[0] || 'there';
  const firstName = displayName.split(' ')[0];

  // Only this person's records, newest first.
  const myRecords = useMemo(() => {
    if (!self) return [];
    return records
      .filter((r) => r && r.id && r.employeeId === self.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [records, self]);

  const todayRecord: Attendance | undefined = myRecords.find((r) => r.date === today);
  const clockedIn = Boolean(todayRecord?.checkIn);
  const clockedOut = Boolean(todayRecord?.checkOut);

  // Live elapsed time since check-in, until they clock out.
  const elapsed = useMemo(
    () => (clockedIn && !clockedOut && clock ? workedMinutes(todayRecord?.checkIn, clock) : null),
    [clockedIn, clockedOut, clock, todayRecord]
  );

  // An approved leave covering today is worth saying out loud before someone
  // clocks in by habit.
  const onLeaveToday = useMemo(() => {
    if (!self) return null;
    const day = new Date();
    return (
      leaves.find(
        (l) => l && l.status === 'Approved' && l.employeeId === self.id && leaveCoversDay(l, day)
      ) ?? null
    );
  }, [leaves, self]);

  // ── This month ──────────────────────────────────────────────────────────────
  const monthPrefix = today.slice(0, 7);
  /** History as a list or as a month grid. The KPIs above stay the same either way. */
  const [historyView, setHistoryView] = useState<'list' | 'month'>('list');
  const [calCursor, setCalCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthRecords = useMemo(
    () => myRecords.filter((r) => r.date?.startsWith(monthPrefix)),
    [myRecords, monthPrefix]
  );
  const presentDays = monthRecords.filter((r) => r.status === 'Present').length;
  const remoteDays = monthRecords.filter((r) => r.status === 'Remote').length;
  const monthMinutes = monthRecords.reduce((sum, r) => sum + (workedMinutes(r.checkIn, r.checkOut) ?? 0), 0);

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });

  const clockIn = async () => {
    if (!self) return;
    setBusy('in');
    try {
      await createAttendance({
        employeeId: self.id,
        date: today,
        status: mode,
        checkIn: nowTime(),
        checkOut: '',
        note: '',
      });
      toast.success('Clocked in', `Marked ${mode.toLowerCase()} at ${fmtTime(nowTime())}.`);
    } catch (err) {
      toast.error('Could not clock in', friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  const clockOut = async () => {
    if (!todayRecord) return;
    setBusy('out');
    const time = nowTime();
    try {
      await updateAttendance(todayRecord.id, { checkOut: time });
      toast.success('Clocked out', `${fmtDuration(workedMinutes(todayRecord.checkIn, time))} logged today.`);
    } catch (err) {
      toast.error('Could not clock out', friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="h-[168px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={CalendarCheck}
        eyebrow="My Portal"
        title="My Attendance"
        description={`Clock in and out and review your own record, ${firstName}.`}
        tone="brand"
        actions={
          fullAccess ? (
            <Link href="/leaves" className="btn-ghost">
              <ArrowRight className="h-4 w-4" /> Team attendance
            </Link>
          ) : undefined
        }
      />

      {/* Who the portal thinks you are — role first, then the employment facts
          that decide what the rest of this page can do. */}
      <div className="surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={displayName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" /> {roleLabel}
            </span>
            {self && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                <Briefcase className="h-3.5 w-3.5" /> {self.type}
              </span>
            )}
            {self?.status === 'Terminated' && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                Inactive
              </span>
            )}
          </div>
        </div>

        {self && (
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Position</dt>
              <dd className="mt-0.5 truncate text-sm text-slate-700">{self.position || '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Department</dt>
              <dd className="mt-0.5 truncate text-sm text-slate-700">{self.department || '—'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <UserRound className="h-3 w-3" /> Manager
              </dt>
              <dd className="mt-0.5 truncate text-sm text-slate-700">{self.reportingManager || '—'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="h-3 w-3" /> Location
              </dt>
              <dd className="mt-0.5 truncate text-sm text-slate-700">
                {[self.city, self.state].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* No employee profile → nothing to attach a timestamp to. Say so plainly
          instead of showing a button that can only fail. */}
      {!self ? (
        <div className="surface p-5">
          <EmptyState
            icon={CalendarCheck}
            tone="brand"
            title="Attendance isn't linked to your account yet"
            description={`Your ${roleLabel} sign-in isn't matched to an employee profile, so there's no record to clock in against. Ask HR to link your profile using this email and this page will start working.`}
          />
        </div>
      ) : (
        <>
          {/* ── Today ── */}
          <div className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today</p>
                <p className="mt-1 font-display text-lg font-bold text-slate-900">{formatDate(today)}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {clock ? fmtTime(clock) : '—'}
                </p>
              </div>

              <div className="text-right">
                {!clockedIn && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    Not marked yet
                  </span>
                )}
                {clockedIn && (
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', statusBadge[todayRecord!.status])}>
                    {todayRecord!.status}
                  </span>
                )}
                {clockedIn && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{fmtTime(todayRecord?.checkIn)}</span>
                    {clockedOut ? (
                      <>
                        <span className="text-slate-300"> → </span>
                        <span className="font-semibold text-slate-900">{fmtTime(todayRecord?.checkOut)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400"> · running</span>
                    )}
                  </p>
                )}
                {clockedIn && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {clockedOut
                      ? `${fmtDuration(workedMinutes(todayRecord?.checkIn, todayRecord?.checkOut))} logged`
                      : `${fmtDuration(elapsed)} so far`}
                  </p>
                )}
              </div>
            </div>

            {onLeaveToday && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
                <CalendarDays className="h-4 w-4 shrink-0" />
                You have approved {onLeaveToday.type.toLowerCase()} leave today. Only clock in if you are actually working.
              </p>
            )}

            {/* Work mode is picked before clocking in; after that the record's
                own status is what counts, and HR edits it if it changes. */}
            {!clockedIn && (
              <div className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
                {WORK_MODES.map((m) => {
                  const ModeIcon = m.icon;
                  const active = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-sm font-semibold transition-all',
                        active ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/[0.04]' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <ModeIcon className="h-4 w-4 shrink-0" /> {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              {!clockedIn && (
                <Button onClick={clockIn} loading={busy === 'in'}>
                  <LogIn className="h-4 w-4" /> Clock in
                </Button>
              )}
              {clockedIn && !clockedOut && (
                <Button onClick={clockOut} loading={busy === 'out'}>
                  <LogOut className="h-4 w-4" /> Clock out
                </Button>
              )}
              {clockedOut && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Your day is recorded. Need a correction? Ask HR to update it.
                </p>
              )}
              {!clockedOut && (
                <p className="text-xs text-slate-400">
                  {clockedIn ? 'Clock out when you finish for the day.' : 'Times are recorded from your device clock.'}
                </p>
              )}
            </div>
          </div>

          {/* ── This month ── */}
          <StatGrid cols={4}>
            <StatCard label="Days marked" value={monthRecords.length} icon={CalendarCheck} tone="brand" hint={`in ${monthLabel}`} />
            <StatCard label="In office" value={presentDays} icon={CheckCircle2} tone="emerald" hint="days present" />
            <StatCard label="Remote" value={remoteDays} icon={Home} tone="sky" hint="days worked remotely" />
            <StatCard label="Hours logged" value={fmtDuration(monthMinutes)} icon={Timer} tone="slate" hint="clocked in to out" />
          </StatGrid>

          {/* ── History ── */}
          <div className="surface">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">My record</h2>
                <p className="text-xs text-slate-400">
                  {historyView === 'month' ? 'Your month at a glance' : 'Your attendance history, newest first'}
                </p>
              </div>
              <Tabs
                ariaLabel="History view"
                value={historyView}
                onChange={setHistoryView}
                items={[
                  { value: 'list' as const, label: 'List', icon: CalendarCheck },
                  { value: 'month' as const, label: 'Month', icon: CalendarDays },
                ]}
              />
            </div>

            {historyView === 'month' ? (
              <AttendanceCalendar
                year={calCursor.year}
                month={calCursor.month}
                records={myRecords}
                onMonthChange={(year, month) => setCalCursor({ year, month })}
                onSelectDate={() => setHistoryView('list')}
              />
            ) : myRecords.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={CalendarCheck}
                  tone="brand"
                  title="Nothing recorded yet"
                  description="Clock in above and your days will start collecting here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {['Date', 'Status', 'Check-in', 'Check-out', 'Hours', 'Note'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700">
                          {formatDate(r.date)}
                          {r.date === today && <span className="ml-2 text-xs font-semibold text-brand-600">Today</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', statusBadge[r.status])}>
                            {r.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">{fmtTime(r.checkIn)}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">{fmtTime(r.checkOut)}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                          {fmtDuration(workedMinutes(r.checkIn, r.checkOut))}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.note ? (
                            <span className="block max-w-[220px] truncate text-sm text-slate-600" title={r.note}>{r.note}</span>
                          ) : (
                            <span className="text-sm text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {myRecords.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-400">
                  {myRecords.length} day{myRecords.length !== 1 ? 's' : ''} on record · corrections are made by HR
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
