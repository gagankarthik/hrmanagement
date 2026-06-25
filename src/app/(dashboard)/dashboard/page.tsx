'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Gauge, ShieldAlert, Percent, Filter, RefreshCw, X, Building2,
  CalendarClock, ChevronRight, TrendingUp, PieChart as PieIcon, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useTimesheets } from '@/context/TimesheetContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import {
  DonutChart, CompareBarChart, TrendAreaChart, HBarChart,
  TYPE_COLOR, VIZ, type DonutDatum,
} from '@/components/dashboard/Charts';
import { PeopleListModal } from '@/components/dashboard/PeopleListModal';
import { KpiCard, ProgressRing, Sparkline, CountUp, type KpiDelta } from '@/components/dashboard/dashboard-ui';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { BillingFunnelWidget } from '@/components/dashboard/widgets/BillingFunnelWidget';
import { ArAgingWidget } from '@/components/dashboard/widgets/ArAgingWidget';
import { LeaveAttendanceWidget } from '@/components/dashboard/widgets/LeaveAttendanceWidget';
import { ComplianceFunnelWidget } from '@/components/dashboard/widgets/ComplianceFunnelWidget';
import { PartnerConcentrationWidget } from '@/components/dashboard/widgets/PartnerConcentrationWidget';
import { DashboardDetailTable } from '@/components/dashboard/widgets/DetailTable';
import type { DataTableColumn } from '@/components/ui/data-table';
import { fullUsd } from '@/lib/format';
import { DashboardFilterProvider, useDashboardFilters } from '@/context/DashboardFilterContext';
import { useAuth } from '@/context/AuthContext';
import { visibleViews, isAdminRole, type DashboardView } from '@/lib/dashboard/views';
import type { Employee, EmployeeType } from '@/types/employee';
import type { Timesheet } from '@/types/timesheet';

const CLASSES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];
const CLASS_LABEL: Record<EmployeeType, string> = { W2: 'W-2', Contract: 'Contract', '1099': '1099', Offshore: 'Offshore' };
const CLASS_TONE: Record<EmployeeType, 'sky' | 'purple' | 'emerald' | 'pink'> = { W2: 'sky', Contract: 'purple', '1099': 'emerald', Offshore: 'pink' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const statusOf = (e: Employee) => ('status' in e ? (e as { status?: string }).status ?? 'Active' : 'Active');
const isActive = (e: Employee) => statusOf(e) === 'Active';
const isBillable = (e: Employee) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
const hasClient = (e: Employee) => {
  const now = new Date();
  return e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) || Boolean(e.clientId || e.client);
};

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors', value === o.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{o.label}</button>
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">{label}</h2>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function DashboardOverview() {
  const router = useRouter();
  const { employees, isLoading, fetchEmployees } = useEmployees();
  const { clients } = useClients();
  const { timesheets, isLoading: tsLoading, fetchTimesheets } = useTimesheets();

  const {
    classFilter, statusFilter, revenueFilter, rangeStart, rangeEnd,
    toggleClass, setStatusFilter, setRevenueFilter, resetFilters, filtersOn,
  } = useDashboardFilters();

  const { roles } = useAuth();
  const isAdmin = isAdminRole(roles);
  const userViews = visibleViews(roles);
  const [view, setView] = useState<DashboardView>('overview');
  const activeView: DashboardView = userViews.some((v) => v.key === view) ? view : 'overview';

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [peopleModal, setPeopleModal] = useState<{ title: string; description?: string; people: Employee[]; tone: 'red' | 'sky' | 'purple' | 'emerald' | 'pink' | 'amber'; ctx?: (e: Employee) => { primary?: string; secondary?: string } } | null>(null);
  const [clientModal, setClientModal] = useState<string | null>(null);

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in90 = new Date(now.getTime() + 90 * 86400000);

  // Loading flags for ChartFrame skeletons (only show skeleton before first data lands).
  const empLoadingInitial = isLoading && employees.length === 0;
  const revLoadingInitial = (isLoading || tsLoading) && timesheets.length === 0 && employees.length === 0;

  // class-only set (for the status donut) and the fully-filtered set
  const byClass = useMemo(() => employees.filter((e) => e && e.id && classFilter.has(e.type)), [employees, classFilter]);
  const emps = useMemo(() => byClass.filter((e) => {
    if (statusFilter !== 'all' && statusOf(e) !== statusFilter) return false;
    if (revenueFilter === 'B' && !isBillable(e)) return false;
    if (revenueFilter === 'NB' && isBillable(e)) return false;
    return true;
  }), [byClass, statusFilter, revenueFilter]);
  const empsActive = useMemo(() => emps.filter(isActive), [emps]);

  const totalActive = empsActive.length;
  const billableCount = empsActive.filter(isBillable).length;
  const utilization = totalActive ? Math.round((billableCount / totalActive) * 100) : 0;
  const benchCount = empsActive.filter((e) => !isBillable(e) || !hasClient(e)).length;

  const classCounts = useMemo(() => {
    const m: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
    emps.forEach((e) => { m[e.type] += 1; });
    return m;
  }, [emps]);

  // Compliance
  const complianceRisk = useMemo(() => empsActive.filter((e) => {
    const ed = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!ed) return false;
    const d = new Date(ed);
    return !Number.isNaN(d.getTime()) && d <= in30;
  }), [empsActive]); // eslint-disable-line react-hooks/exhaustive-deps
  // Work-authorization expiry timeline (active employees, within 90 days).
  const expiryTimeline = useMemo(() => {
    const items: { id: string; name: string; days: number; sub: string; href: string }[] = [];
    empsActive.forEach((e) => {
      const ed = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!ed) return;
      const d = new Date(ed);
      if (Number.isNaN(d.getTime()) || d > in90) return;
      items.push({
        id: e.id,
        name: e.name || 'Unnamed',
        days: Math.round((d.getTime() - now.getTime()) / 86400000),
        sub: ('workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined) || 'Work authorization',
        href: `/employees/${e.id}`,
      });
    });
    return items.sort((a, b) => a.days - b.days);
  }, [empsActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hiring trend BY TYPE — monthly new hires, one stacked series per class
  const hiringByType = useMemo(() => {
    const rows: Record<string, unknown>[] = [];
    for (let i = 7; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const row: Record<string, unknown> = { month: MONTHS[ms.getMonth()] };
      CLASSES.forEach((c) => {
        row[CLASS_LABEL[c]] = emps.filter((e) => e.type === c && e.hireDate && (() => { const d = new Date(e.hireDate); return d >= ms && d < me; })()).length;
      });
      rows.push(row);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emps]);

  const typeDonut: DonutDatum[] = useMemo(
    () => CLASSES.filter((c) => classCounts[c] > 0).map((c) => ({ name: CLASS_LABEL[c], value: classCounts[c], color: TYPE_COLOR[c] })),
    [classCounts],
  );

  const statusDonut: DonutDatum[] = useMemo(() => {
    let a = 0, t = 0;
    byClass.forEach((e) => { if (statusOf(e) === 'Active') a++; else if (statusOf(e) === 'Terminated') t++; });
    const out: DonutDatum[] = [];
    if (a) out.push({ name: 'Active', value: a, color: VIZ.emerald });
    if (t) out.push({ name: 'Terminated', value: t, color: VIZ.rose });
    return out;
  }, [byClass]);

  const billableData = useMemo(
    () => CLASSES.filter((c) => empsActive.some((e) => e.type === c)).map((c) => {
      const inC = empsActive.filter((e) => e.type === c);
      return { type: CLASS_LABEL[c], Billable: inC.filter(isBillable).length, 'Non-billable': inC.filter((e) => !isBillable(e)).length };
    }) as Record<string, unknown>[],
    [empsActive],
  );

  const utilData = useMemo(
    () => CLASSES.filter((c) => empsActive.some((e) => e.type === c)).map((c) => {
      const inC = empsActive.filter((e) => e.type === c);
      return { type: CLASS_LABEL[c], Utilization: inC.length ? Math.round((inC.filter(isBillable).length / inC.length) * 100) : 0 };
    }) as Record<string, unknown>[],
    [empsActive],
  );

  // Revenue by client (timesheets) → fallback to headcount-by-client
  const tsInRange = useMemo(
    () => timesheets.filter((t) => {
      if (!t || !t.id) return false;
      if (!rangeStart && !rangeEnd) return true;
      if (!t.periodStart) return false;
      const d = new Date(t.periodStart);
      if (Number.isNaN(d.getTime())) return false;
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    }),
    [timesheets, rangeStart, rangeEnd],
  );
  const revenueByClient = useMemo(() => {
    const m: Record<string, { id: string; name: string; revenue: number; cost: number; hours: number }> = {};
    tsInRange.forEach((t) => {
      const id = t.clientId || 'unassigned';
      if (!m[id]) m[id] = { id, name: t.clientName || 'Unassigned', revenue: 0, cost: 0, hours: 0 };
      m[id].revenue += (t.billRate || 0) * (t.hours || 0);
      m[id].cost += (t.payRate || 0) * (t.hours || 0);
      m[id].hours += t.hours || 0;
    });
    return Object.values(m).sort((a, b) => b.revenue - a.revenue);
  }, [tsInRange]);
  const revenueMode = revenueByClient.length > 0;
  const clientChart = useMemo(() => {
    if (revenueMode) return revenueByClient.slice(0, 6).map((c) => ({ name: c.name, value: Math.round(c.revenue), id: c.id, color: VIZ.brand }));
    const m: Record<string, { id: string; name: string; value: number }> = {};
    empsActive.forEach((e) => {
      const cid = e.clientId || e.clientAssignments?.[0]?.clientId;
      if (!cid) return;
      const name = clients.find((c) => c.id === cid)?.name || e.client;
      if (!name) return;
      if (!m[cid]) m[cid] = { id: cid, name, value: 0 };
      m[cid].value += 1;
    });
    return Object.values(m).sort((a, b) => b.value - a.value).slice(0, 6).map((c) => ({ ...c, color: VIZ.teal }));
  }, [revenueMode, revenueByClient, empsActive, clients]);

  const { blendedMargin, weeklyGp } = useMemo(() => {
    let gp = 0, bill = 0;
    empsActive.forEach((e) => { if (isBillable(e) && (e.billRate ?? 0) > 0) { gp += ((e.billRate ?? 0) - (e.payRate ?? 0)) * 40; bill += (e.billRate ?? 0) * 40; } });
    return { blendedMargin: bill > 0 ? Math.round((gp / bill) * 100) : 0, weeklyGp: gp };
  }, [empsActive]);
  const gpSpark = useMemo(() => {
    const s: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      let gp = 0;
      timesheets.forEach((t) => { if (!t.periodStart) return; const d = new Date(t.periodStart); if (d >= ms && d < me) gp += ((t.billRate || 0) - (t.payRate || 0)) * (t.hours || 0); });
      s.push(Math.round(gp));
    }
    return s.some((v) => v !== 0) ? s : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesheets]);

  // Active-headcount trajectory — cumulative active workers at each month-end (last 6 months).
  const headcountSpark = useMemo(() => {
    const s: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      let c = 0;
      byClass.forEach((e) => {
        if (!e.hireDate) return;
        const h = new Date(e.hireDate);
        if (Number.isNaN(h.getTime()) || h >= monthEnd) return; // not yet hired by month-end
        if (e.dor) { const d = new Date(e.dor); if (!Number.isNaN(d.getTime()) && d < monthEnd) return; } // already left
        c += 1;
      });
      s.push(c);
    }
    return s.some((v) => v !== 0) ? s : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byClass]);

  // Period-over-period delta from a trend series (last point vs the prior point).
  const deltaFrom = (s: number[], goodWhen: 'up' | 'down' = 'up'): KpiDelta | undefined => {
    if (s.length < 2) return undefined;
    const cur = s[s.length - 1], prev = s[s.length - 2];
    if (prev === 0) return undefined;
    const pct = ((cur - prev) / Math.abs(prev)) * 100;
    if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) return undefined;
    return { value: pct, direction: pct >= 0 ? 'up' : 'down', goodWhen };
  };

  const handleRefresh = async () => { if (refreshing) return; setRefreshing(true); try { await Promise.all([fetchEmployees(), fetchTimesheets()]); } finally { setRefreshing(false); } };
  const fmtDate = (s?: string) => { if (!s) return '—'; const d = new Date(s); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const tsMargin = (t: Timesheet) => { const bill = (t.billRate || 0) * (t.hours || 0); const pay = (t.payRate || 0) * (t.hours || 0); return bill > 0 ? ((bill - pay) / bill) * 100 : 0; };

  const ctxExpiry = (e: Employee) => {
    const ed = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!ed) return {};
    const d = new Date(ed);
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    return { primary: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), secondary: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left` };
  };
  const onClientBar = (row: Record<string, unknown>) => { const id = row.id as string; if (!id) return; if (revenueMode) setClientModal(id); else router.push(`/clients/${id}`); };

  const drillRows = useMemo(() => {
    if (!clientModal) return [];
    const m: Record<string, { name: string; hours: number; bill: number; pay: number }> = {};
    tsInRange.filter((t) => (t.clientId || 'unassigned') === clientModal).forEach((t) => {
      const key = t.employeeId || t.employeeName || 'unknown';
      if (!m[key]) m[key] = { name: t.employeeName || 'Worker', hours: 0, bill: 0, pay: 0 };
      m[key].hours += t.hours || 0; m[key].bill += (t.billRate || 0) * (t.hours || 0); m[key].pay += (t.payRate || 0) * (t.hours || 0);
    });
    return Object.values(m).sort((a, b) => b.bill - a.bill);
  }, [clientModal, tsInRange]);
  const drillClient = revenueByClient.find((c) => c.id === clientModal);

  /* ── Composable view blocks (only the active view's blocks mount) ───────── */
  const financialBlock = (
    <React.Fragment>
      <SectionDivider label="Revenue & receivables" />
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartFrame
          title={revenueMode ? 'Revenue by client' : 'Top clients'}
          subtitle={revenueMode ? 'Billed from timesheets · click a bar to drill in' : 'By people placed'}
          icon={Building2}
          className="lg:col-span-2"
          height={300}
          skeleton="hbar"
          isLoading={revLoadingInitial}
          isEmpty={!clientChart.length}
          onRetry={handleRefresh}
          emptyLabel="No client placements yet"
          emptyHint="Log timesheets with bill & pay rates to see billed revenue by client."
          emptyCta={{ label: 'Go to Margins', href: '/margins' }}
        >
          <HBarChart data={clientChart as Record<string, unknown>[]} categoryKey="name" valueKey="value" money={revenueMode} color={revenueMode ? VIZ.brand : VIZ.teal} height={300} onBarClick={onClientBar} />
        </ChartFrame>
        <PartnerConcentrationWidget />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <BillingFunnelWidget />
        <ArAgingWidget />
      </div>
    </React.Fragment>
  );

  const workforceBlock = (
    <React.Fragment>
      <SectionDivider label="Headcount & utilization" />
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartFrame
          title="Hiring trend by type"
          subtitle="New hires per month · last 8 months"
          icon={TrendingUp}
          className="lg:col-span-2"
          height={280}
          skeleton="bars"
          isLoading={empLoadingInitial}
          isEmpty={!emps.length}
          emptyLabel="No employees match the filters"
          emptyHint="Adjust the filters or date range to see hiring momentum."
        >
          <CompareBarChart data={hiringByType} xKey="month" stacked height={280} bars={CLASSES.map((c) => ({ key: CLASS_LABEL[c], name: CLASS_LABEL[c], color: TYPE_COLOR[c] }))} />
        </ChartFrame>
        <ChartFrame
          title="Workforce by type"
          subtitle={`${emps.length} in view`}
          icon={PieIcon}
          height={280}
          skeleton="donut"
          isLoading={empLoadingInitial}
          isEmpty={!typeDonut.length}
          emptyLabel="No employees"
        >
          <DonutChart data={typeDonut} height={280} />
        </ChartFrame>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartFrame title="Active vs terminated" subtitle="Workforce status" icon={Users} height={240} skeleton="donut" isLoading={empLoadingInitial} isEmpty={!statusDonut.length} emptyLabel="No status data">
          <DonutChart data={statusDonut} height={240} />
        </ChartFrame>
        <ChartFrame title="Billable vs non-billable" subtitle="By employment class" icon={BarChart3} height={240} skeleton="bars" isLoading={empLoadingInitial} isEmpty={!billableData.length} emptyLabel="No active employees">
          <CompareBarChart data={billableData} xKey="type" stacked height={240} bars={[{ key: 'Billable', name: 'Billable', color: VIZ.emerald }, { key: 'Non-billable', name: 'Non-billable', color: VIZ.slate }]} />
        </ChartFrame>
        <ChartFrame title="Utilization by class" subtitle="Billable share %" icon={Gauge} height={240} skeleton="bars" isLoading={empLoadingInitial} isEmpty={!utilData.length} emptyLabel="No active employees">
          <CompareBarChart data={utilData} xKey="type" height={240} bars={[{ key: 'Utilization', name: 'Utilization %', color: VIZ.brand }]} />
        </ChartFrame>
      </div>
    </React.Fragment>
  );

  const complianceBlock = (
    <React.Fragment>
      <SectionDivider label="Compliance & time off" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ComplianceFunnelWidget /></div>
        <ChartFrame
          title="Compliance expiry"
          subtitle="Next 90 days"
          icon={CalendarClock}
          height={300}
          skeleton="list"
          isLoading={empLoadingInitial}
          isEmpty={expiryTimeline.length === 0}
          emptyLabel="Nothing expiring in 90 days"
          action={<button onClick={() => router.push('/compliance')} className="text-xs font-semibold text-brand-700 hover:underline">View all</button>}
        >
          <ul className="space-y-2.5">
            {expiryTimeline.slice(0, 6).map(({ id, name, days, sub, href }) => {
              const tone = days < 7 ? { bar: 'bg-red-500', chip: 'bg-red-50 text-red-600 ring-red-200' } : days < 30 ? { bar: 'bg-accent-400', chip: 'bg-accent-50 text-accent-700 ring-accent-200' } : { bar: 'bg-slate-300', chip: 'bg-slate-50 text-slate-500 ring-slate-200' };
              const fill = Math.max(6, Math.min(100, 100 - (days / 90) * 100));
              return (
                <li key={`${href}-${id}`}>
                  <button onClick={() => router.push(href)} className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', tone.chip)}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</span>
                      </div>
                      <p className="truncate text-[11px] text-slate-400">{sub}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${fill}%` }} /></div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.75} />
                  </button>
                </li>
              );
            })}
          </ul>
        </ChartFrame>
      </div>
      <div className="grid gap-5">
        <LeaveAttendanceWidget />
      </div>
    </React.Fragment>
  );

  /* ── Tier-3 detail table — view-aware recent slice with CSV/PDF export ──── */
  type ExpiryRow = { id: string; name: string; days: number; sub: string; href: string };
  const statusChip = (s: string) => (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', s === 'Terminated' ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200')}>{s}</span>
  );

  const employeeColumns: DataTableColumn<Employee>[] = [
    { id: 'name', header: 'Name', cell: (e) => <span className="font-semibold text-slate-900">{e.name || 'Unnamed'}</span>, sortValue: (e) => e.name?.toLowerCase() ?? '' },
    { id: 'type', header: 'Type', cell: (e) => <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">{CLASS_LABEL[e.type]}</span>, sortValue: (e) => e.type },
    { id: 'position', header: 'Position', hideBelow: 'md', cell: (e) => e.position || '—', sortValue: (e) => e.position ?? '' },
    { id: 'hireDate', header: 'Hire date', hideBelow: 'sm', cell: (e) => fmtDate(e.hireDate), sortValue: (e) => e.hireDate ?? '' },
    { id: 'status', header: 'Status', align: 'right', cell: (e) => statusChip(statusOf(e)), sortValue: (e) => statusOf(e) },
  ];

  const timesheetColumns: DataTableColumn<Timesheet>[] = [
    { id: 'worker', header: 'Worker', cell: (t) => <span className="font-semibold text-slate-900">{t.employeeName}</span>, sortValue: (t) => t.employeeName?.toLowerCase() ?? '' },
    { id: 'client', header: 'Client', hideBelow: 'md', cell: (t) => t.clientName || 'Unassigned', sortValue: (t) => t.clientName ?? '' },
    { id: 'period', header: 'Period', hideBelow: 'lg', cell: (t) => `${fmtDate(t.periodStart)} – ${fmtDate(t.periodEnd)}`, sortValue: (t) => t.periodEnd ?? '' },
    { id: 'hours', header: 'Hours', align: 'right', cell: (t) => t.hours ?? 0, sortValue: (t) => t.hours ?? 0 },
    { id: 'billed', header: 'Billed', align: 'right', cell: (t) => fullUsd((t.billRate || 0) * (t.hours || 0)), sortValue: (t) => (t.billRate || 0) * (t.hours || 0) },
    { id: 'margin', header: 'Margin', align: 'right', cell: (t) => { const m = tsMargin(t); return <span className={cn('font-semibold', m >= 25 ? 'text-emerald-600' : 'text-accent-600')}>{m.toFixed(0)}%</span>; }, sortValue: (t) => tsMargin(t) },
    { id: 'status', header: 'Status', align: 'right', hideBelow: 'sm', cell: (t) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t.status}</span>, sortValue: (t) => t.status },
  ];

  const expiryColumns: DataTableColumn<ExpiryRow>[] = [
    { id: 'name', header: 'Name', cell: (r) => <span className="font-semibold text-slate-900">{r.name}</span>, sortValue: (r) => r.name.toLowerCase() },
    { id: 'auth', header: 'Authorization', hideBelow: 'md', cell: (r) => r.sub, sortValue: (r) => r.sub },
    { id: 'days', header: 'Days left', align: 'right', cell: (r) => <span className={cn('font-semibold', r.days < 7 ? 'text-red-600' : r.days < 30 ? 'text-accent-600' : 'text-slate-600')}>{r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d`}</span>, sortValue: (r) => r.days },
  ];

  const detailTable =
    activeView === 'financial' ? (
      <DashboardDetailTable<Timesheet>
        title="Recent timesheets" subtitle="Latest billing entries in range" icon={Building2}
        columns={timesheetColumns}
        data={[...tsInRange].sort((a, b) => (b.periodEnd || '').localeCompare(a.periodEnd || ''))}
        getRowId={(t) => t.id} caption="Recent timesheets" isLoading={revLoadingInitial}
        onRowClick={() => router.push('/timesheets')} viewAllHref="/timesheets"
        exportName="dashboard-timesheets" initialSort={{ columnId: 'period', dir: 'desc' }}
        empty={{ title: 'No timesheets in this period' }}
        serialize={{
          headers: ['Worker', 'Client', 'Period', 'Hours', 'Billed', 'Paid', 'Margin %', 'Status'],
          row: (t) => [t.employeeName, t.clientName || 'Unassigned', `${fmtDate(t.periodStart)} – ${fmtDate(t.periodEnd)}`, t.hours || 0, Math.round((t.billRate || 0) * (t.hours || 0)), Math.round((t.payRate || 0) * (t.hours || 0)), `${tsMargin(t).toFixed(0)}%`, t.status],
        }}
      />
    ) : activeView === 'compliance' ? (
      <DashboardDetailTable<ExpiryRow>
        title="Work authorization expiry" subtitle="Active workers · next 90 days" icon={CalendarClock}
        columns={expiryColumns} data={expiryTimeline as ExpiryRow[]} getRowId={(r) => r.id} caption="Work authorization expiry"
        isLoading={empLoadingInitial} onRowClick={(r) => router.push(r.href)} viewAllHref="/compliance"
        exportName="dashboard-compliance" initialSort={{ columnId: 'days', dir: 'asc' }}
        empty={{ title: 'Nothing expiring in 90 days' }}
        serialize={{
          headers: ['Name', 'Authorization', 'Days left'],
          row: (r) => [r.name, r.sub, r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d`],
        }}
      />
    ) : (
      <DashboardDetailTable<Employee>
        title="Recent hires" subtitle="Most recent additions in view" icon={Users}
        columns={employeeColumns}
        data={[...emps].sort((a, b) => (b.hireDate || '').localeCompare(a.hireDate || ''))}
        getRowId={(e) => e.id} caption="Recent employees" isLoading={empLoadingInitial}
        onRowClick={(e) => router.push(`/employees/${e.id}`)} viewAllHref="/employees"
        exportName="dashboard-employees" initialSort={{ columnId: 'hireDate', dir: 'desc' }}
        empty={{ title: 'No employees match the filters' }}
        serialize={{
          headers: ['Name', 'Type', 'Position', 'Hire date', 'Status'],
          row: (e) => [e.name || 'Unnamed', CLASS_LABEL[e.type], e.position || '—', fmtDate(e.hireDate), statusOf(e)],
        }}
      />
    );

  return (
    <PageContainer>
      <PageHeader
        icon={Gauge}
        eyebrow="Overview"
        title="Workforce command center"
        description="Billing, compliance, and headcount at a glance."
        tone="brand"
        actions={
          <>
            <DateRangePicker />
            <button onClick={handleRefresh} disabled={refreshing} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50" title="Refresh">
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} strokeWidth={1.75} />
            </button>
            <button onClick={() => setFiltersOpen((v) => !v)} className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all', filtersOpen || filtersOn ? 'btn-primary' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
              <Filter className="h-4 w-4" strokeWidth={1.75} /> Filters
              {filtersOn && <span className="h-1.5 w-1.5 rounded-full bg-white/70" />}
            </button>
          </>
        }
      />

      {/* View switcher — Overview / Financial / Compliance / Workforce (role-gated) */}
      <div className="inline-flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/70 p-1 sm:w-auto">
        {userViews.map((v) => {
          const VIcon = v.icon;
          const on = activeView === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              aria-pressed={on}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-display text-sm font-semibold transition-all sm:flex-none sm:px-4',
                on ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/[0.04]' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <VIcon className="h-4 w-4" strokeWidth={1.75} />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Inline filter panel (no side drawer) */}
      {filtersOpen && (
        <div className="surface animate-in fade-in slide-in-from-top-2 p-5 duration-200">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</p>
              <Segmented value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'Active', label: 'Active' }, { value: 'Terminated', label: 'Terminated' }]} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Revenue</p>
              <Segmented value={revenueFilter} onChange={setRevenueFilter} options={[{ value: 'all', label: 'All' }, { value: 'B', label: 'Billable' }, { value: 'NB', label: 'Non-billable' }]} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Employment class</p>
              <div className="flex flex-wrap gap-1.5">
                {CLASSES.map((c) => <button key={c} onClick={() => toggleClass(c)} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', classFilter.has(c) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{CLASS_LABEL[c]}</button>)}
              </div>
            </div>
            <div className="flex items-end justify-end lg:col-span-2">
              <button onClick={resetFilters} disabled={!filtersOn} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
                <X className="h-4 w-4" strokeWidth={1.75} /> Reset
              </button>
            </div>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">Showing {emps.length} of {employees.length} employees · date range applies to billed-revenue widgets</p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Active workforce" value={<CountUp value={totalActive} />} tone="brand" why="How big your active team is right now — the foundation for every other metric." delta={deltaFrom(headcountSpark)} spark={headcountSpark} period="vs last month" />
        <KpiCard icon={Gauge} label="Billable utilization" value={`${utilization}%`} tone={utilization >= 75 ? 'emerald' : 'red'} why="Share of active workers who are billable. Core profitability metric — red below the 75% target." accessory={<ProgressRing value={utilization} color={utilization >= 75 ? '#059669' : '#dc2626'} label={`${utilization}%`} />} />
        <KpiCard icon={ShieldAlert} label="Compliance at risk" value={<CountUp value={complianceRisk.length} />} tone="red" alert={complianceRisk.length > 0} why="Work authorizations expiring within 30 days or already expired. Click to see who." onClick={complianceRisk.length ? () => setPeopleModal({ title: 'Compliance at risk', description: 'Expiring within 30 days or already expired', people: complianceRisk, tone: 'red', ctx: ctxExpiry }) : undefined} />
        {isAdmin && (
          <KpiCard icon={Percent} label="Blended margin" value={`${blendedMargin}%`} tone={blendedMargin >= 25 ? 'emerald' : 'amber'} why="Profit after paying contractors, from bill vs pay rates. Set rates on the Margins page." accessory={gpSpark.length ? <Sparkline data={gpSpark} /> : undefined} delta={deltaFrom(gpSpark)} period="vs last month" sub={<span className="text-right text-[11px] font-semibold text-slate-400">{usd0(weeklyGp)}/wk</span>} />
        )}
      </div>

      {/* ── VIEW COMPOSITION — Overview shows all (financial gated); each tab is a focused slice ── */}
      {activeView === 'overview' && (
        <React.Fragment>
          {isAdmin && financialBlock}
          {workforceBlock}
          {complianceBlock}
        </React.Fragment>
      )}
      {activeView === 'financial' && isAdmin && financialBlock}
      {activeView === 'workforce' && workforceBlock}
      {activeView === 'compliance' && complianceBlock}

      {/* ── TIER-3 DETAIL — recent records with sort + CSV/PDF export ── */}
      <SectionDivider label="Details" />
      {detailTable}

      {isLoading && employees.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" /> Loading workforce…</p>
      )}

      <PeopleListModal
        isOpen={peopleModal !== null}
        onClose={() => setPeopleModal(null)}
        title={peopleModal?.title ?? ''}
        description={peopleModal?.description}
        people={peopleModal?.people ?? []}
        contextGetter={peopleModal?.ctx}
        tone={peopleModal?.tone}
        footerLink={{ href: '/employees', label: 'Open the full employee list' }}
      />

      {clientModal && drillClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setClientModal(null)} />
          <div className="surface relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">{drillClient.name}</h3>
                <p className="text-xs text-slate-500">Hours billed vs. paid · {usd0(drillClient.revenue)} revenue</p>
              </div>
              <button onClick={() => setClientModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-left">Worker</th><th className="px-3 py-2.5 text-right">Hours</th><th className="px-3 py-2.5 text-right">Billed</th><th className="px-3 py-2.5 text-right">Paid</th><th className="px-5 py-2.5 text-right">Margin</th>
                </tr></thead>
                <tbody>
                  {drillRows.map((r) => {
                    const margin = r.bill > 0 ? ((r.bill - r.pay) / r.bill) * 100 : 0;
                    return (
                      <tr key={r.name} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-2.5 font-medium text-slate-800">{r.name}</td>
                        <td className="tnum px-3 py-2.5 text-right text-slate-600">{r.hours}</td>
                        <td className="tnum px-3 py-2.5 text-right font-semibold text-slate-900">{usd0(r.bill)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-slate-500">{usd0(r.pay)}</td>
                        <td className={cn('tnum px-5 py-2.5 text-right font-semibold', margin >= 25 ? 'text-emerald-600' : 'text-accent-600')}>{margin.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-sm">
              <span className="text-slate-500">{drillClient.hours} hrs · gross profit</span>
              <span className="font-display text-lg font-bold text-emerald-700">{usd0(drillClient.revenue - drillClient.cost)}</span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function DashboardPage() {
  return (
    <DashboardFilterProvider>
      <DashboardOverview />
    </DashboardFilterProvider>
  );
}
