'use client';

import * as React from 'react';
import { CalendarCheck, Clock, Plane, UserCheck } from 'lucide-react';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { DonutChart, VIZ, type DonutDatum } from '@/components/dashboard/Charts';
import { useLeaves } from '@/context/LeaveContext';
import { useAttendance } from '@/context/AttendanceContext';
import { useDashboardFilters } from '@/context/DashboardFilterContext';
import type { LeaveType } from '@/types/leave';

const LEAVE_COLORS: Record<LeaveType, string> = {
  Sick: VIZ.rose, Casual: VIZ.sky, PTO: VIZ.emerald, 'Long Leave': VIZ.violet, Unpaid: VIZ.slate,
};
const PRESENT = new Set(['Present', 'Remote', 'Half-day']);

function Tile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="tnum font-display text-lg font-bold leading-none text-slate-900">{value}</p>
        <p className="truncate text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/**
 * Leave & attendance pulse — pending approvals, who's out today, presence rate,
 * and the mix of leave types. Surfaces time-off ops the dashboard never showed.
 */
export function LeaveAttendanceWidget() {
  const { leaves, isLoading: lLoading, fetchLeaves } = useLeaves();
  const { records, isLoading: aLoading } = useAttendance();
  const { rangeStart, rangeEnd } = useDashboardFilters();

  const inRange = React.useCallback((iso?: string) => {
    if (!rangeStart && !rangeEnd) return true;
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    if (rangeStart && d < rangeStart) return false;
    if (rangeEnd && d > rangeEnd) return false;
    return true;
  }, [rangeStart, rangeEnd]);

  const { pending, onLeaveToday, attendanceRate, hasAttendance, typeDonut } = React.useMemo(() => {
    const valid = leaves.filter((l) => l && l.id);
    const pending = valid.filter((l) => l.status === 'Pending').length;

    const today = new Date();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const onLeaveToday = valid.filter((l) => {
      if (l.status !== 'Approved') return false;
      const s = l.startDate ? new Date(l.startDate).getTime() : NaN;
      const e = l.endDate ? new Date(l.endDate).getTime() : s;
      return !Number.isNaN(s) && t0 >= new Date(s).setHours(0, 0, 0, 0) && t0 <= new Date(e).setHours(0, 0, 0, 0);
    }).length;

    const recs = records.filter((r) => r && r.id && inRange(r.date));
    const present = recs.filter((r) => PRESENT.has(r.status)).length;
    const attendanceRate = recs.length ? Math.round((present / recs.length) * 100) : 0;

    const counts: Record<string, number> = {};
    valid.forEach((l) => { if (inRange(l.appliedDate || l.startDate)) counts[l.type] = (counts[l.type] || 0) + 1; });
    const typeDonut: DonutDatum[] = (Object.keys(counts) as LeaveType[])
      .map((t) => ({ name: t, value: counts[t], color: LEAVE_COLORS[t] || VIZ.slate }))
      .sort((a, b) => b.value - a.value);

    return { pending, onLeaveToday, attendanceRate, hasAttendance: recs.length > 0, typeDonut };
  }, [leaves, records, inRange]);

  const isLoading = (lLoading || aLoading) && leaves.length === 0 && records.length === 0;
  const isEmpty = leaves.length === 0 && records.length === 0;

  return (
    <ChartFrame
      title="Leave & attendance"
      subtitle="Approvals, who's out, and presence"
      icon={CalendarCheck}
      height={250}
      skeleton="list"
      isLoading={isLoading}
      isEmpty={isEmpty}
      onRetry={fetchLeaves}
      emptyLabel="No leave or attendance records yet"
      emptyCta={{ label: 'Go to Leave', href: '/dashboard/leaves' }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-2.5">
          <Tile icon={Clock} label="Pending approvals" value={pending} tone="bg-accent-50 text-accent-700" />
          <Tile icon={Plane} label="On leave today" value={onLeaveToday} tone="bg-violet-50 text-violet-700" />
          <Tile icon={UserCheck} label="Attendance rate" value={hasAttendance ? `${attendanceRate}%` : '—'} tone="bg-emerald-50 text-emerald-700" />
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Leave by type</p>
          {typeDonut.length ? (
            <DonutChart data={typeDonut} height={180} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-xs text-slate-400">No leave in range</div>
          )}
        </div>
      </div>
    </ChartFrame>
  );
}
