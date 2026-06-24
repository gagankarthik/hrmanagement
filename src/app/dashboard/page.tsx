'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Gauge, ShieldAlert, Percent, Filter, RefreshCw, X, Building2,
  CalendarClock, ChevronRight, Sparkles, TrendingUp, PieChart as PieIcon, BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useTimesheets } from '@/context/TimesheetContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { coiStatus } from '@/lib/coi';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  DonutChart, CompareBarChart, TrendAreaChart, HBarChart,
  TYPE_COLOR, VIZ, type DonutDatum,
} from '@/components/dashboard/Charts';
import { PeopleListModal } from '@/components/dashboard/PeopleListModal';
import { KpiCard, ProgressRing, Sparkline, CountUp, SectionCard } from '@/components/dashboard/dashboard-ui';
import PartnersPanel from '@/components/dashboard/PartnersPanel';
import type { Employee, EmployeeType } from '@/types/employee';

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

type StatusFilter = 'all' | 'Active' | 'Terminated';
type RevenueFilter = 'all' | 'B' | 'NB';
type RangePreset = 'all' | 'ytd' | '12m' | '90d';
const RANGES: { value: RangePreset; label: string }[] = [
  { value: 'all', label: 'All time' }, { value: 'ytd', label: 'Year to date' },
  { value: '12m', label: 'Last 12 months' }, { value: '90d', label: 'Last 90 days' },
];

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors', value === o.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{o.label}</button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { employees, isLoading, fetchEmployees } = useEmployees();
  const { clients } = useClients();
  const { timesheets } = useTimesheets();
  const { subcontractors } = useSubcontractors();

  const [classFilter, setClassFilter] = useState<Set<EmployeeType>>(new Set(CLASSES));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>('all');
  const [range, setRange] = useState<RangePreset>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [peopleModal, setPeopleModal] = useState<{ title: string; description?: string; people: Employee[]; tone: 'red' | 'sky' | 'purple' | 'emerald' | 'pink' | 'amber'; ctx?: (e: Employee) => { primary?: string; secondary?: string } } | null>(null);
  const [clientModal, setClientModal] = useState<string | null>(null);

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in90 = new Date(now.getTime() + 90 * 86400000);

  const rangeCutoff = useMemo(() => {
    if (range === 'ytd') return new Date(now.getFullYear(), 0, 1);
    if (range === '12m') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    if (range === '90d') return new Date(now.getTime() - 90 * 86400000);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

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
  // Subcontractor COI policies expiring within 60 days (or already expired).
  const coiExpiring = useMemo(() => (
    subcontractors
      .map((s) => ({ s, coi: coiStatus(s.coiExpiryDate) }))
      .filter(({ coi }) => coi.state === 'expiring' || coi.state === 'expired')
      .sort((a, b) => (a.coi.days ?? 0) - (b.coi.days ?? 0))
  ), [subcontractors]);

  // Unified compliance timeline — employee work-auth (90d) + subcontractor COI (60d).
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
        href: `/dashboard/employees/${e.id}`,
      });
    });
    coiExpiring.forEach(({ s, coi }) => {
      items.push({ id: s.id, name: s.name, days: coi.days ?? 0, sub: 'COI policy', href: `/dashboard/subcontractors/${s.id}` });
    });
    return items.sort((a, b) => a.days - b.days);
  }, [empsActive, coiExpiring]); // eslint-disable-line react-hooks/exhaustive-deps

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
    () => timesheets.filter((t) => t && t.id && (!rangeCutoff || (t.periodStart && new Date(t.periodStart) >= rangeCutoff))),
    [timesheets, rangeCutoff],
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

  const insights = useMemo(() => {
    const out: string[] = [];
    if (complianceRisk.length) out.push(`${complianceRisk.length} work authorization${complianceRisk.length > 1 ? 's' : ''} expiring within 30 days.`);
    if (coiExpiring.length) out.push(`${coiExpiring.length} subcontractor COI ${coiExpiring.length > 1 ? 'policies' : 'policy'} expiring within 60 days.`);
    out.push(utilization >= 75 ? `Billable utilization is healthy at ${utilization}%.` : `Billable utilization is ${utilization}% — below the 75% target.`);
    if (revenueMode) {
      const total = revenueByClient.reduce((s, c) => s + c.revenue, 0);
      if (total > 0) out.push(`${revenueByClient[0].name} is your top client at ${Math.round((revenueByClient[0].revenue / total) * 100)}% of billed revenue.`);
    } else if (weeklyGp === 0) out.push('Set bill & pay rates on the Margins page to unlock revenue and margin insights.');
    if (benchCount) out.push(`${benchCount} active ${benchCount === 1 ? 'worker is' : 'workers are'} on the bench.`);
    return out.slice(0, 3);
  }, [complianceRisk.length, coiExpiring.length, utilization, revenueMode, revenueByClient, weeklyGp, benchCount]);

  const handleRefresh = async () => { if (refreshing) return; setRefreshing(true); try { await fetchEmployees(); } finally { setRefreshing(false); } };
  const toggleClass = (c: EmployeeType) => setClassFilter((prev) => { const n = new Set(prev); if (n.has(c)) { if (n.size > 1) n.delete(c); } else n.add(c); return n; });
  const resetFilters = () => { setClassFilter(new Set(CLASSES)); setStatusFilter('all'); setRevenueFilter('all'); setRange('all'); };
  const filtersOn = classFilter.size < 4 || statusFilter !== 'all' || revenueFilter !== 'all' || range !== 'all';

  const ctxExpiry = (e: Employee) => {
    const ed = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!ed) return {};
    const d = new Date(ed);
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    return { primary: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), secondary: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left` };
  };
  const onClientBar = (row: Record<string, unknown>) => { const id = row.id as string; if (!id) return; if (revenueMode) setClientModal(id); else router.push(`/dashboard/clients/${id}`); };

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

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Gauge}
        eyebrow="Overview"
        title="Workforce command center"
        description="Billing, compliance, and headcount at a glance."
        tone="brand"
        actions={
          <>
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
            <div className="lg:col-span-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Date range · billed revenue</p>
              <Segmented value={range} onChange={setRange} options={RANGES} />
            </div>
            <div className="flex items-end justify-end">
              <button onClick={resetFilters} disabled={!filtersOn} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
                <X className="h-4 w-4" strokeWidth={1.75} /> Reset
              </button>
            </div>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{emps.length} of {employees.length} employees in view</p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Active workforce" value={<CountUp value={totalActive} />} tone="brand" why="How big your active team is right now — the foundation for every other metric." />
        <KpiCard icon={Gauge} label="Billable utilization" value={`${utilization}%`} tone={utilization >= 75 ? 'emerald' : 'red'} why="Share of active workers who are billable. Core profitability metric — red below the 75% target." accessory={<ProgressRing value={utilization} color={utilization >= 75 ? '#059669' : '#dc2626'} label={`${utilization}%`} />} />
        <KpiCard icon={ShieldAlert} label="Compliance at risk" value={<CountUp value={complianceRisk.length} />} tone="red" alert={complianceRisk.length > 0} why="Work authorizations expiring within 30 days or already expired. Click to see who." onClick={complianceRisk.length ? () => setPeopleModal({ title: 'Compliance at risk', description: 'Expiring within 30 days or already expired', people: complianceRisk, tone: 'red', ctx: ctxExpiry }) : undefined} />
        <KpiCard icon={Percent} label="Blended margin" value={`${blendedMargin}%`} tone={blendedMargin >= 25 ? 'emerald' : 'amber'} why="Profit after paying contractors, from bill vs pay rates. Set rates on the Margins page." accessory={gpSpark.length ? <Sparkline data={gpSpark} /> : undefined} sub={<span className="text-right text-[11px] font-semibold text-slate-400">{usd0(weeklyGp)}/wk</span>} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="surface flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700"><Sparkles className="h-3.5 w-3.5 text-accent-500" strokeWidth={1.75} /> Insights</span>
          <ul className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {insights.map((t, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-600"><span className={cn('h-1.5 w-1.5 rounded-full', i === 0 && complianceRisk.length ? 'bg-red-500' : 'bg-brand-400')} />{t}</li>)}
          </ul>
        </div>
      )}

      {/* Row A — hiring trend by type + workforce by type */}
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Hiring trend by type" subtitle="New hires per month · last 8 months" icon={TrendingUp} className="lg:col-span-2">
          {emps.length ? (
            <CompareBarChart data={hiringByType} xKey="month" stacked height={280} bars={CLASSES.map((c) => ({ key: CLASS_LABEL[c], name: CLASS_LABEL[c], color: TYPE_COLOR[c] }))} />
          ) : <p className="py-16 text-center text-sm text-slate-400">No employees match the filters.</p>}
        </SectionCard>
        <SectionCard title="Workforce by type" subtitle={`${emps.length} in view`} icon={PieIcon}>
          {typeDonut.length ? <DonutChart data={typeDonut} height={280} /> : <p className="py-16 text-center text-sm text-slate-400">No employees.</p>}
        </SectionCard>
      </div>

      {/* Row B — status + billable mix + utilization (comparisons) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Active vs terminated" subtitle="Workforce status" icon={Users}>
          {statusDonut.length ? <DonutChart data={statusDonut} height={240} /> : <p className="py-14 text-center text-sm text-slate-400">No status data.</p>}
        </SectionCard>
        <SectionCard title="Billable vs non-billable" subtitle="By employment class" icon={BarChart3}>
          {billableData.length ? <CompareBarChart data={billableData} xKey="type" stacked height={240} bars={[{ key: 'Billable', name: 'Billable', color: VIZ.emerald }, { key: 'Non-billable', name: 'Non-billable', color: VIZ.slate }]} /> : <p className="py-14 text-center text-sm text-slate-400">No active employees.</p>}
        </SectionCard>
        <SectionCard title="Utilization by class" subtitle="Billable share %" icon={Gauge}>
          {utilData.length ? <CompareBarChart data={utilData} xKey="type" height={240} bars={[{ key: 'Utilization', name: 'Utilization %', color: VIZ.brand }]} /> : <p className="py-14 text-center text-sm text-slate-400">No active employees.</p>}
        </SectionCard>
      </div>

      {/* Row C — revenue + compliance */}
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title={revenueMode ? 'Revenue by client' : 'Top clients'} subtitle={revenueMode ? 'Billed from timesheets · click a bar to drill in' : 'By people placed'} icon={Building2} className="lg:col-span-2">
          {clientChart.length ? <HBarChart data={clientChart as Record<string, unknown>[]} categoryKey="name" valueKey="value" money={revenueMode} color={revenueMode ? VIZ.brand : VIZ.teal} height={280} onBarClick={onClientBar} /> : <p className="py-16 text-center text-sm text-slate-400">No client placements yet.</p>}
        </SectionCard>
        <SectionCard title="Compliance expiry" subtitle="Next 90 days" icon={CalendarClock} action={<button onClick={() => router.push('/dashboard/compliance')} className="text-xs font-semibold text-brand-700 hover:underline">View all</button>}>
          {expiryTimeline.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Nothing expiring in 90 days.</p>
          ) : (
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
          )}
        </SectionCard>
      </div>

      {/* Subcontractor COI expiry — dedicated card */}
      <SectionCard
        title="Subcontractor COI expiry"
        subtitle="Insurance policies expiring within 60 days, per company"
        icon={ShieldCheck}
        action={<button onClick={() => router.push('/dashboard/subcontractors')} className="text-xs font-semibold text-brand-700 hover:underline">View all</button>}
      >
        {coiExpiring.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">All subcontractor COIs are current — nothing expiring in 60 days.</p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {coiExpiring.map(({ s, coi }) => {
              const expired = coi.state === 'expired';
              const chip = expired
                ? 'bg-red-50 text-red-600 ring-red-200'
                : (coi.days ?? 99) < 30
                  ? 'bg-accent-50 text-accent-700 ring-accent-200'
                  : 'bg-amber-50 text-amber-700 ring-amber-200';
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/dashboard/subcontractors/${s.id}`)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{s.name}</span>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', chip)}>
                        {expired ? `${Math.abs(coi.days ?? 0)}d overdue` : `${coi.days}d`}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-400">{coi.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Top partners — tabbed table */}
      <PartnersPanel />

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
        footerLink={{ href: '/dashboard/employees', label: 'Open the full employee list' }}
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
    </div>
  );
}
