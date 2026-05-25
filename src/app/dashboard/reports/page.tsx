'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3, Download, Users, TrendingUp, MapPin, AlertTriangle,
  FileText, Printer, Filter, X, DollarSign, Briefcase, Building2, Package,
  CheckCircle2, Shield, Activity, Award, UserCheck, UserX, Calendar,
  AlertOctagon, ChevronRight, Wallet, Heart,
} from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Employee, EmployeeType } from '@/types/employee';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';

const HOURS_PER_MONTH = 173;

const TYPE_COLOR: Record<EmployeeType, { hex: string; bg: string; text: string; ring: string }> = {
  W2:       { hex: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200' },
  Contract: { hex: '#a855f7', bg: 'bg-purple-50',  text: 'text-purple-700',  ring: 'ring-purple-200' },
  '1099':   { hex: '#14b8a6', bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-200' },
  Offshore: { hex: '#ec4899', bg: 'bg-pink-50',    text: 'text-pink-700',    ring: 'ring-pink-200' },
};

const TYPE_LABEL: Record<EmployeeType, string> = {
  W2: 'W-2', Contract: 'Contract', '1099': '1099', Offshore: 'Offshore',
};

type TabId = 'workforce' | 'compliance' | 'financial' | 'activity' | 'network';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'workforce',  label: 'Workforce',  icon: Users },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'financial',  label: 'Financial',  icon: DollarSign },
  { id: 'activity',   label: 'Activity',   icon: Activity },
  { id: 'network',    label: 'Network',    icon: Building2 },
];

// ─────────────────── Helpers ───────────────────
function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}
function monthlyPay(e: Employee): number {
  const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
  const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
  const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
  if (typeof pay === 'number' && pay > 0) return salaryType === 'Hourly' ? pay * HOURS_PER_MONTH : pay / 12;
  if (typeof salary === 'number' && salary > 0) return salary;
  return 0;
}
function compactCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
function fullCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  return `$${Math.round(n).toLocaleString()}`;
}
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const out = [headers.join(',')];
  for (const row of rows) {
    out.push(headers.map((h) => {
      const v = row[h];
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(','));
  }
  const blob = new Blob([out.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const { employees, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('workforce');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<EmployeeType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [filterRevenue, setFilterRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');

  const allStates = useMemo(() => Array.from(new Set(employees.map((e) => e.state).filter(Boolean))).sort(), [employees]);
  const allClientOptions = useMemo(() => clients.filter((c) => c?.id && c?.name).sort((a, b) => a.name.localeCompare(b.name)), [clients]);
  const allVendorOptions = useMemo(() => vendors.filter((v) => v?.id && v?.name).sort((a, b) => a.name.localeCompare(b.name)), [vendors]);

  const hasFilters =
    filterType !== 'all' || filterStatus !== 'all' || filterRevenue !== 'all' ||
    filterState !== 'all' || filterClient !== 'all' || filterVendor !== 'all';

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterStatus !== 'all' && 'status' in e && (e as { status: string }).status !== filterStatus) return false;
      if (filterRevenue !== 'all' && 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus !== filterRevenue) return false;
      if (filterState !== 'all' && e.state !== filterState) return false;
      if (filterClient !== 'all') {
        const ids = e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []);
        if (!ids.includes(filterClient)) return false;
      }
      if (filterVendor !== 'all') {
        const ids = e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []);
        if (!ids.includes(filterVendor)) return false;
      }
      return true;
    });
  }, [employees, filterType, filterStatus, filterRevenue, filterState, filterClient, filterVendor]);

  const clearFilters = () => {
    setFilterType('all'); setFilterStatus('all'); setFilterRevenue('all');
    setFilterState('all'); setFilterClient('all'); setFilterVendor('all');
  };

  // ─────────── Metrics ───────────
  const metrics = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in60 = new Date(now.getTime() + 60 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);

    const active = filtered.filter(isActive);
    let revenue = 0, totalPay = 0, billable = 0;
    let expired = 0, b30 = 0, b60 = 0, b90 = 0;
    let withMedical = 0, with401k = 0, w2Count = 0;
    let bench = 0;
    let totalTenureDays = 0, tenureCount = 0;

    active.forEach((e) => {
      const pay = monthlyPay(e);
      totalPay += pay;
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (isBillable) { billable += 1; revenue += pay; }

      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (expiry) {
        const d = new Date(expiry);
        if (!Number.isNaN(d.getTime())) {
          if (d < now) expired += 1;
          else if (d <= in30) b30 += 1;
          else if (d <= in60) b60 += 1;
          else if (d <= in90) b90 += 1;
        }
      }

      const hasClient =
        e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
        Boolean(e.clientId || e.client);
      if (!hasClient || !isBillable) bench += 1;

      if (e.type === 'W2') {
        w2Count += 1;
        if ('medicalBenefit' in e && (e as { medicalBenefit?: boolean }).medicalBenefit) withMedical += 1;
        if ('benefit401k' in e && (e as { benefit401k?: boolean }).benefit401k) with401k += 1;
      }

      if (e.hireDate) {
        const h = new Date(e.hireDate);
        if (!Number.isNaN(h.getTime())) {
          totalTenureDays += differenceInDays(now, h);
          tenureCount += 1;
        }
      }
    });

    return {
      total: filtered.length,
      active: active.length,
      terminated: filtered.length - active.length,
      revenue, totalPay, billable,
      utilization: active.length ? Math.round((billable / active.length) * 100) : 0,
      bench, expired, b30, b60, b90,
      withMedical, with401k, w2Count,
      avgTenureYears: tenureCount ? +(totalTenureDays / tenureCount / 365).toFixed(1) : null,
    };
  }, [filtered]);

  // ─────────── Print/Export ───────────
  const exportCurrentCSV = () => {
    const rows = filtered.map((e) => ({
      Name: e.name,
      Type: e.type,
      Position: e.position || '',
      Status: 'status' in e ? (e as { status: string }).status : '',
      Email: e.personalEmail || '',
      Phone: e.contactNo || '',
      State: e.state || '',
      City: e.city || '',
      HireDate: e.hireDate ? format(new Date(e.hireDate), 'yyyy-MM-dd') : '',
      WorkAuth: 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization || '' : '',
      ExpiryDate: 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate || '' : '',
      Revenue: 'revenueStatus' in e ? (e as { revenueStatus?: string }).revenueStatus || '' : '',
      Pay: 'pay' in e ? (e as { pay?: number }).pay || '' : '',
      SalaryType: 'salaryType' in e ? (e as { salaryType?: string }).salaryType || '' : '',
    }));
    downloadCSV(rows, 'workforce_report');
    toast.success('CSV downloaded', `${rows.length} records exported.`);
  };

  const exportPDF = () => {
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) return;
    win.document.open();
    win.document.write(buildPdfHtml({
      filtered, clients, vendors, metrics,
      filters: {
        type: filterType, status: filterStatus, revenue: filterRevenue,
        state: filterState, client: filterClient, vendor: filterVendor,
        hasFilters,
      },
    }));
    win.document.close();
    toast.info('Print dialog opened', 'Use "Save as PDF" in the print menu.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        icon={BarChart3}
        eyebrow="Reporting"
        title="Workforce Reports"
        tone="indigo"
        description="Filter the data, switch sections, and export a print-ready PDF or raw CSV."
        actions={
          <>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                showFilters || hasFilters ? 'btn-primary' : 'btn-ghost'
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {[filterType, filterStatus, filterRevenue, filterClient, filterVendor, filterState].filter((f) => f !== 'all').length}
                </span>
              )}
            </button>
            <button onClick={exportCurrentCSV} className="btn-ghost">
              <Download className="h-4 w-4 text-emerald-600" />
              CSV
            </button>
            <button onClick={exportPDF} className="btn-primary">
              <Printer className="h-4 w-4" />
              Export PDF
            </button>
          </>
        }
      />

      {/* FILTERS */}
      {showFilters && (
        <div className="surface p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect label="Class" value={filterType} onChange={(v) => setFilterType(v as EmployeeType | 'all')} options={[
              { value: 'all', label: 'All classes' }, { value: 'W2', label: 'W-2' }, { value: 'Contract', label: 'Contract' },
              { value: '1099', label: '1099' }, { value: 'Offshore', label: 'Offshore' },
            ]} />
            <FilterSelect label="Status" value={filterStatus} onChange={(v) => setFilterStatus(v as 'Active' | 'Terminated' | 'all')} options={[
              { value: 'all', label: 'Any status' }, { value: 'Active', label: 'Active' }, { value: 'Terminated', label: 'Terminated' },
            ]} />
            <FilterSelect label="Revenue" value={filterRevenue} onChange={(v) => setFilterRevenue(v as 'B' | 'NB' | 'all')} options={[
              { value: 'all', label: 'Any revenue' }, { value: 'B', label: 'Billable' }, { value: 'NB', label: 'Non-billable' },
            ]} />
            <FilterSelect label="State" value={filterState} onChange={setFilterState} options={[
              { value: 'all', label: 'All states' }, ...allStates.map((s) => ({ value: s as string, label: s as string })),
            ]} />
            <FilterSelect label="Client" value={filterClient} onChange={setFilterClient} options={[
              { value: 'all', label: 'All clients' }, ...allClientOptions.map((c) => ({ value: c.id, label: c.name })),
            ]} />
            <FilterSelect label="Vendor" value={filterVendor} onChange={setFilterVendor} options={[
              { value: 'all', label: 'All vendors' }, ...allVendorOptions.map((v) => ({ value: v.id, label: v.name })),
            ]} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              <span className="font-semibold tabular-nums text-slate-900">{filtered.length.toLocaleString()}</span> of {employees.length.toLocaleString()} employees in scope
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXEC SUMMARY */}
      <section className="surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Executive Summary</p>
            <h2 className="mt-1 font-display text-lg font-bold text-slate-900 sm:text-xl">
              Workforce snapshot — {format(new Date(), 'MMMM d, yyyy')}
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Live numbers across {filtered.length.toLocaleString()} {filtered.length === 1 ? 'employee' : 'employees'}{hasFilters ? ' (filtered)' : ''}.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
          <SummaryStat icon={Users} label="Headcount" value={metrics.total.toLocaleString()} sub={`${metrics.active} active`} tone="indigo" />
          <SummaryStat icon={DollarSign} label="Run-rate" value={compactCurrency(metrics.revenue)} sub="monthly billable" tone="emerald" />
          <SummaryStat icon={UserCheck} label="Utilization" value={`${metrics.utilization}%`} sub={`${metrics.billable} billable`} tone="purple" />
          <SummaryStat icon={AlertOctagon} label="Expired" value={`${metrics.expired}`} sub="work auths" tone={metrics.expired > 0 ? 'red' : 'slate'} />
          <SummaryStat icon={AlertTriangle} label="Expire 30d" value={`${metrics.b30}`} sub="renewals due" tone={metrics.b30 > 0 ? 'amber' : 'slate'} />
          <SummaryStat icon={Award} label="Avg tenure" value={metrics.avgTenureYears !== null ? `${metrics.avgTenureYears}y` : '—'} sub="years of service" tone="sky" />
        </div>
      </section>

      {/* TAB SWITCHER */}
      <div className="surface overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="space-y-6">
        {activeTab === 'workforce'  && <WorkforceTab  filtered={filtered} clients={clients} vendors={vendors} />}
        {activeTab === 'compliance' && <ComplianceTab filtered={filtered} metrics={metrics} />}
        {activeTab === 'financial'  && <FinancialTab  filtered={filtered} metrics={metrics} />}
        {activeTab === 'activity'   && <ActivityTab   filtered={filtered} />}
        {activeTab === 'network'    && <NetworkTab    filtered={filtered} clients={clients} vendors={vendors} />}
      </div>

      <footer className="surface px-5 py-3 text-xs text-slate-500">
        Generated live · {filtered.length.toLocaleString()} of {employees.length.toLocaleString()} records ·
        Last refreshed {format(new Date(), 'MMM d, yyyy · HH:mm')}
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab content
// ════════════════════════════════════════════════════════════════

interface TabProps {
  filtered: Employee[];
  clients?: { id: string; name: string }[];
  vendors?: { id: string; name: string }[];
}

function WorkforceTab({ filtered }: TabProps) {
  const typeDist = useMemo(() => {
    const m: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
    filtered.forEach((e) => m[e.type] += 1);
    return (Object.entries(m) as [EmployeeType, number][]).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const stateDist = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((e) => { if (e.state) m[e.state] = (m[e.state] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const statusByType = useMemo(() => {
    const m: Record<EmployeeType, { active: number; terminated: number }> = {
      W2: { active: 0, terminated: 0 }, Contract: { active: 0, terminated: 0 },
      '1099': { active: 0, terminated: 0 }, Offshore: { active: 0, terminated: 0 },
    };
    filtered.forEach((e) => {
      const s = 'status' in e ? (e as { status: string }).status : 'Active';
      if (s === 'Active') m[e.type].active += 1; else m[e.type].terminated += 1;
    });
    return m;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportCard title="Headcount by Class" subtitle="Class distribution + status breakdown" icon={Users}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 pr-4">Class</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Active</th>
              <th className="py-3 pr-4">Terminated</th>
              <th className="py-3 pr-4">Share</th>
              <th className="py-3">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {typeDist.map((t) => {
              const total = t.value;
              const a = statusByType[t.label].active;
              const x = statusByType[t.label].terminated;
              const share = filtered.length ? (total / filtered.length) * 100 : 0;
              return (
                <tr key={t.label} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', TYPE_COLOR[t.label].bg, TYPE_COLOR[t.label].text, TYPE_COLOR[t.label].ring)}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t.label].hex }} />
                      {TYPE_LABEL[t.label]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-slate-900">{total}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-700">{a}</td>
                  <td className="py-3 pr-4 tabular-nums text-red-600">{x}</td>
                  <td className="py-3 pr-4 tabular-nums text-slate-600">{share.toFixed(1)}%</td>
                  <td className="py-3 min-w-[120px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: TYPE_COLOR[t.label].hex }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-xs font-bold text-slate-700">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4 tabular-nums">{filtered.length}</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{filtered.filter(isActive).length}</td>
              <td className="py-3 pr-4 tabular-nums text-red-600">{filtered.length - filtered.filter(isActive).length}</td>
              <td className="py-3 pr-4 tabular-nums">100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      <ReportCard title="Top States" subtitle="Where your workforce is concentrated" icon={MapPin}>
        {stateDist.length === 0 ? (
          <EmptyState title="No state data" description="No employees with state information in the filtered set." />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Rank</th>
                <th className="py-2.5 pr-4">State</th>
                <th className="py-2.5 pr-4">Employees</th>
                <th className="py-2.5">Share</th>
              </tr>
            </thead>
            <tbody>
              {stateDist.map((s, i) => {
                const share = filtered.length ? (s.value / filtered.length) * 100 : 0;
                return (
                  <tr key={s.label} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{s.label}</td>
                    <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{s.value}</td>
                    <td className="py-2.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportCard>
    </div>
  );
}

function ComplianceTab({ filtered, metrics }: TabProps & { metrics: { expired: number; b30: number; b60: number; b90: number; w2Count: number; withMedical: number; with401k: number } }) {
  const expiring = useMemo(() => {
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 86400000);
    return filtered.filter((e) => {
      if (!isActive(e)) return false;
      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!expiry) return false;
      const d = new Date(expiry);
      return !Number.isNaN(d.getTime()) && d <= in90;
    }).sort((a, b) => {
      const da = new Date((a as { expiryDate?: string }).expiryDate!).getTime();
      const db = new Date((b as { expiryDate?: string }).expiryDate!).getTime();
      return da - db;
    });
  }, [filtered]);

  const authMix = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((e) => {
      const wa = 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined;
      if (wa) m[wa] = (m[wa] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportCard title="Authorization Expiry Pipeline" subtitle={`${expiring.length} active employee${expiring.length === 1 ? '' : 's'} with authorizations expiring in the next 90 days (or already expired)`} icon={Shield}>
        {expiring.length === 0 ? (
          <EmptyState title="All clear" description="No upcoming or expired work authorizations in the current scope." tone="emerald" icon={CheckCircle2} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Authorization</th>
                  <th className="py-2.5 pr-4">Expiry</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">State</th>
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 20).map((e) => {
                  const expiry = (e as { expiryDate?: string }).expiryDate;
                  const wa = (e as { workAuthorization?: string }).workAuthorization;
                  const now = new Date();
                  const exp = new Date(expiry!);
                  const days = differenceInDays(exp, now);
                  const tone = days < 0 ? 'red' : days <= 30 ? 'amber' : days <= 60 ? 'yellow' : 'sky';
                  const toneColor = tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200'
                    : tone === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : tone === 'yellow' ? 'bg-yellow-50 text-yellow-700 ring-yellow-200'
                    : 'bg-sky-50 text-sky-700 ring-sky-200';
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-500">{e.position || '—'}</p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{wa || '—'}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">
                        {format(exp, 'MMM d, yyyy')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', toneColor)}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{e.state || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expiring.length > 20 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing 20 of {expiring.length}. Export the full list as CSV or PDF for the complete record.
              </p>
            )}
          </div>
        )}
      </ReportCard>

      <ReportCard title="Work Authorization Mix" subtitle="Top 10 authorization types across the filtered workforce" icon={FileText}>
        {authMix.length === 0 ? (
          <EmptyState title="No authorization data" description="No employees with work authorization info in scope." />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Authorization</th>
                <th className="py-2.5 pr-4">Count</th>
                <th className="py-2.5">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {authMix.map((a) => {
                const share = filtered.length ? (a.value / filtered.length) * 100 : 0;
                return (
                  <tr key={a.label} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{a.label}</td>
                    <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{a.value}</td>
                    <td className="py-2.5 min-w-[140px]">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportCard>

      {metrics.w2Count > 0 && (
        <ReportCard title="W-2 Benefits Adoption" subtitle={`Among ${metrics.w2Count} W-2 employee${metrics.w2Count === 1 ? '' : 's'} in scope`} icon={Heart}>
          <div className="grid gap-4 sm:grid-cols-2">
            <BenefitRow icon={Heart} label="Medical Benefit" enrolled={metrics.withMedical} total={metrics.w2Count} color="#10b981" />
            <BenefitRow icon={Wallet} label="401(k) Enrollment" enrolled={metrics.with401k} total={metrics.w2Count} color="#f59e0b" />
          </div>
        </ReportCard>
      )}
    </div>
  );
}

function BenefitRow({ icon: Icon, label, enrolled, total, color }: { icon: React.ElementType; label: string; enrolled: number; total: number; color: string }) {
  const pct = total ? Math.round((enrolled / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-500">{enrolled} of {total} enrolled</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function FinancialTab({ filtered, metrics }: TabProps & { metrics: { revenue: number; totalPay: number; billable: number; utilization: number } }) {
  const runRateByType = useMemo(() => {
    const m: Record<EmployeeType, { revenue: number; pay: number; count: number; billableCount: number }> = {
      W2: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      Contract: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      '1099': { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      Offshore: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
    };
    filtered.forEach((e) => {
      if (!isActive(e)) return;
      const pay = monthlyPay(e);
      m[e.type].count += 1;
      m[e.type].pay += pay;
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (isBillable) {
        m[e.type].revenue += pay;
        m[e.type].billableCount += 1;
      }
    });
    return (Object.entries(m) as [EmployeeType, typeof m[EmployeeType]][]).map(([t, v]) => ({ type: t, ...v }));
  }, [filtered]);

  const topEarners = useMemo(() => {
    return filtered
      .filter(isActive)
      .map((e) => ({ employee: e, monthly: monthlyPay(e) }))
      .filter((x) => x.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 10);
  }, [filtered]);

  const maxRevenue = Math.max(...runRateByType.map((r) => r.revenue), 1);

  return (
    <div className="space-y-6">
      <ReportCard title="Monthly Run-Rate by Class" subtitle="Billable revenue contribution per employee class" icon={DollarSign}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 pr-4">Class</th>
              <th className="py-3 pr-4">Active</th>
              <th className="py-3 pr-4">Billable</th>
              <th className="py-3 pr-4">Avg pay/mo</th>
              <th className="py-3 pr-4">Monthly run-rate</th>
              <th className="py-3">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {runRateByType.map((r) => {
              const avg = r.billableCount ? r.revenue / r.billableCount : 0;
              const w = (r.revenue / maxRevenue) * 100;
              return (
                <tr key={r.type} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', TYPE_COLOR[r.type].bg, TYPE_COLOR[r.type].text, TYPE_COLOR[r.type].ring)}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[r.type].hex }} />
                      {TYPE_LABEL[r.type]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-900">{r.count}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-700">{r.billableCount}</td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">{avg > 0 ? compactCurrency(avg) : '—'}</td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-emerald-700">{compactCurrency(r.revenue)}</td>
                  <td className="py-3 min-w-[140px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: TYPE_COLOR[r.type].hex }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-xs font-bold text-slate-700">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4 tabular-nums">{runRateByType.reduce((s, r) => s + r.count, 0)}</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{metrics.billable}</td>
              <td className="py-3 pr-4 text-slate-500">{metrics.utilization}% util</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{compactCurrency(metrics.revenue)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      <ReportCard title="Top 10 Earners" subtitle="Highest monthly pay across active employees" icon={TrendingUp}>
        {topEarners.length === 0 ? (
          <EmptyState title="No pay data" description="No employees with pay information in the filtered set." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Rank</th>
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Position</th>
                  <th className="py-2.5 pr-4">Type</th>
                  <th className="py-2.5">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {topEarners.map((row, i) => {
                  const e = row.employee;
                  const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
                  const revenueStatus = 'revenueStatus' in e ? (e as { revenueStatus?: string }).revenueStatus : undefined;
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{e.position || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {salaryType || '—'} · {revenueStatus === 'B' ? 'Billable' : revenueStatus === 'NB' ? 'Non-billable' : '—'}
                      </td>
                      <td className="py-2.5 font-bold tabular-nums text-emerald-700">{fullCurrency(row.monthly)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>
    </div>
  );
}

function ActivityTab({ filtered }: TabProps) {
  const recentHires = useMemo(() => {
    const now = new Date();
    const last90 = new Date(now.getTime() - 90 * 86400000);
    return filtered
      .filter((e) => {
        if (!e.hireDate) return false;
        const h = new Date(e.hireDate);
        return !Number.isNaN(h.getTime()) && h >= last90 && h <= now;
      })
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());
  }, [filtered]);

  const recentTerminations = useMemo(() => {
    const now = new Date();
    const last90 = new Date(now.getTime() - 90 * 86400000);
    return filtered
      .filter((e) => {
        if (!('status' in e) || (e as { status: string }).status !== 'Terminated') return false;
        if (!e.dor) return false;
        const d = new Date(e.dor);
        return !Number.isNaN(d.getTime()) && d >= last90 && d <= now;
      })
      .sort((a, b) => new Date(b.dor!).getTime() - new Date(a.dor!).getTime());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat icon={UserCheck} label="Hires (90d)" value={recentHires.length.toString()} sub="last 90 days" tone="emerald" />
        <SummaryStat icon={UserX} label="Terminations (90d)" value={recentTerminations.length.toString()} sub="last 90 days" tone="red" />
      </div>

      <ReportCard title="Recent Hires" subtitle="Last 90 days, most recent first" icon={UserCheck}>
        {recentHires.length === 0 ? (
          <EmptyState title="No recent hires" description="No new hires in the last 90 days." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Position</th>
                  <th className="py-2.5 pr-4">Location</th>
                  <th className="py-2.5">Hired</th>
                </tr>
              </thead>
              <tbody>
                {recentHires.slice(0, 25).map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                        {TYPE_LABEL[e.type]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{e.position || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">{[e.city, e.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-slate-900">{format(new Date(e.hireDate), 'MMM d, yyyy')}</p>
                      <p className="text-[11px] text-slate-400">{differenceInDays(new Date(), new Date(e.hireDate))}d ago</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentHires.length > 25 && <p className="mt-3 text-xs text-slate-500">Showing 25 of {recentHires.length}. Export for the full list.</p>}
          </div>
        )}
      </ReportCard>

      {recentTerminations.length > 0 && (
        <ReportCard title="Recent Terminations" subtitle="Last 90 days, most recent first" icon={UserX}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Tenure</th>
                  <th className="py-2.5">Released</th>
                </tr>
              </thead>
              <tbody>
                {recentTerminations.slice(0, 25).map((e) => {
                  const tenure = e.hireDate && e.dor ? differenceInYears(new Date(e.dor), new Date(e.hireDate)) : null;
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{tenure !== null ? `${tenure}y` : '—'}</td>
                      <td className="py-2.5 font-medium text-slate-900">{format(new Date(e.dor!), 'MMM d, yyyy')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  );
}

function NetworkTab({ filtered, clients = [], vendors = [] }: TabProps) {
  const distribute = (
    pickIds: (e: Employee) => string[],
    lookup: { id: string; name: string }[],
  ) => {
    const dist: Record<string, { id: string; name: string; count: number; active: number }> = {};
    filtered.forEach((e) => {
      pickIds(e).forEach((id) => {
        const name = lookup.find((x) => x.id === id)?.name || id;
        if (!dist[id]) dist[id] = { id, name, count: 0, active: 0 };
        dist[id].count += 1;
        if (isActive(e)) dist[id].active += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count);
  };

  const topClients = distribute(
    (e) => e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []),
    clients
  );
  const topVendors = distribute(
    (e) => e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []),
    vendors
  );
  const topEndClients = distribute(
    (e) => e.endClientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.endClientId ? [e.endClientId] : []),
    clients
  );
  const topEndVendors = distribute(
    (e) => e.endVendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.endVendorId ? [e.endVendorId] : []),
    vendors
  );

  return (
    <div className="space-y-6">
      <NetworkTable title="Clients" items={topClients} icon={Building2} accent="#10b981" />
      <NetworkTable title="Vendors" items={topVendors} icon={Package} accent="#a855f7" />
      {topEndClients.length > 0 && <NetworkTable title="End-Clients" items={topEndClients} icon={Building2} accent="#14b8a6" />}
      {topEndVendors.length > 0 && <NetworkTable title="End-Vendors" items={topEndVendors} icon={Package} accent="#f59e0b" />}
    </div>
  );
}

function NetworkTable({ title, items, icon: Icon, accent }: { title: string; items: { id: string; name: string; count: number; active: number }[]; icon: React.ElementType; accent: string }) {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <ReportCard title={`Top ${title}`} subtitle={`${items.length} ${title.toLowerCase()} · ${total} placements total`} icon={Icon}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="py-2.5 pr-4">Rank</th>
            <th className="py-2.5 pr-4">{title}</th>
            <th className="py-2.5 pr-4">Placements</th>
            <th className="py-2.5 pr-4">Active</th>
            <th className="py-2.5">Share</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 12).map((item, i) => {
            const share = total ? (item.count / total) * 100 : 0;
            return (
              <tr key={item.id || item.name} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                <td className="py-2.5 pr-4 font-medium text-slate-900">{item.name}</td>
                <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{item.count}</td>
                <td className="py-2.5 pr-4 tabular-nums text-emerald-700">{item.active}</td>
                <td className="py-2.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: accent }} />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{share.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ReportCard>
  );
}

// ════════════════════════════════════════════════════════════════
// Reusable atoms
// ════════════════════════════════════════════════════════════════

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const SUMMARY_TONE: Record<string, { iconBg: string; iconColor: string; value: string }> = {
  indigo:  { iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  value: 'text-slate-900' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', value: 'text-emerald-700' },
  purple:  { iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  value: 'text-slate-900' },
  amber:   { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   value: 'text-amber-700' },
  red:     { iconBg: 'bg-red-100',     iconColor: 'text-red-600',     value: 'text-red-700' },
  sky:     { iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     value: 'text-slate-900' },
  slate:   { iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   value: 'text-slate-700' },
};

function SummaryStat({ icon: Icon, label, value, sub, tone }: { icon: React.ElementType; label: string; value: string; sub?: string; tone: keyof typeof SUMMARY_TONE }) {
  const t = SUMMARY_TONE[tone];
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', t.iconBg)}>
        <Icon className={cn('h-4 w-4', t.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={cn('mt-0.5 font-display text-lg font-bold tabular-nums leading-tight sm:text-xl', t.value)}>{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function ReportCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <Icon className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 sm:text-base">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="overflow-x-auto px-5 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// PDF HTML builder
// ════════════════════════════════════════════════════════════════

interface BuildPdfArgs {
  filtered: Employee[];
  clients: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  metrics: { total: number; active: number; terminated: number; revenue: number; billable: number; utilization: number; bench: number; expired: number; b30: number; b60: number; b90: number; avgTenureYears: number | null };
  filters: { type: string; status: string; revenue: string; state: string; client: string; vendor: string; hasFilters: boolean };
}

function buildPdfHtml({ filtered, clients, vendors, metrics, filters }: BuildPdfArgs): string {
  const now = new Date();
  const dateStr = format(now, 'MMMM d, yyyy');
  const timeStr = format(now, 'HH:mm');

  // Aggregations
  const typeDist: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
  const stateDist: Record<string, number> = {};
  const authMix: Record<string, number> = {};
  filtered.forEach((e) => {
    typeDist[e.type] += 1;
    if (e.state) stateDist[e.state] = (stateDist[e.state] || 0) + 1;
    const wa = 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined;
    if (wa) authMix[wa] = (authMix[wa] || 0) + 1;
  });
  const topStates = Object.entries(stateDist).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topAuth = Object.entries(authMix).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Expiring
  const in90 = new Date(now.getTime() + 90 * 86400000);
  const expiring = filtered.filter((e) => {
    if (!isActive(e)) return false;
    const exp = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!exp) return false;
    const d = new Date(exp);
    return !Number.isNaN(d.getTime()) && d <= in90;
  }).sort((a, b) => new Date((a as { expiryDate?: string }).expiryDate!).getTime() - new Date((b as { expiryDate?: string }).expiryDate!).getTime());

  // Active filter chips
  const chipLabel = (k: string, v: string): string | null => {
    if (v === 'all') return null;
    if (k === 'Client') return `Client: ${clients.find((c) => c.id === v)?.name || v}`;
    if (k === 'Vendor') return `Vendor: ${vendors.find((vv) => vv.id === v)?.name || v}`;
    return `${k}: ${v}`;
  };
  const activeFilters = [
    chipLabel('Class', filters.type),
    chipLabel('Status', filters.status),
    chipLabel('Revenue', filters.revenue === 'B' ? 'Billable' : filters.revenue === 'NB' ? 'Non-Billable' : filters.revenue),
    chipLabel('State', filters.state),
    chipLabel('Client', filters.client),
    chipLabel('Vendor', filters.vendor),
  ].filter(Boolean);

  // Top placements
  const topClients = (() => {
    const m: Record<string, { name: string; count: number }> = {};
    filtered.forEach((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []);
      ids.forEach((id) => {
        const name = clients.find((c) => c.id === id)?.name || id;
        if (!m[id]) m[id] = { name, count: 0 };
        m[id].count += 1;
      });
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 10);
  })();
  const topVendors = (() => {
    const m: Record<string, { name: string; count: number }> = {};
    filtered.forEach((e) => {
      const ids = e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []);
      ids.forEach((id) => {
        const name = vendors.find((vv) => vv.id === id)?.name || id;
        if (!m[id]) m[id] = { name, count: 0 };
        m[id].count += 1;
      });
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 10);
  })();

  const css = `
    @page { size: A4; margin: 14mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a; font-size: 11px; line-height: 1.45;
      background: #fff;
    }

    /* COVER */
    .cover { padding: 48px 32px; }
    .cover .brand {
      display: flex; align-items: center; gap: 12px;
      padding-bottom: 18px; border-bottom: 1px solid #cbd5e1;
    }
    .cover .brand-mark {
      width: 36px; height: 36px; border-radius: 8px;
      background: #4f46e5; display: inline-flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;
    }
    .cover .brand-info p:first-child { font-weight: 800; font-size: 16px; letter-spacing: -0.01em; color: #0f172a; }
    .cover .brand-info p:last-child  { font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.16em; }

    .cover-title {
      margin-top: 36px;
      font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; color: #0f172a;
    }
    .cover-sub {
      margin-top: 12px; font-size: 14px; color: #475569; max-width: 460px;
    }
    .cover-meta {
      margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px;
    }
    .cover-meta .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 999px;
      background: #eef2ff; color: #3730a3;
      font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
    }
    .cover-grid {
      margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }
    .cover-stat {
      padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;
      page-break-inside: avoid;
    }
    .cover-stat .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; }
    .cover-stat .value { margin-top: 6px; font-size: 24px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .cover-stat .sub   { margin-top: 2px; font-size: 10px; color: #64748b; }
    .cover-stat.alert .value { color: #b91c1c; }
    .cover-stat.warn  .value { color: #b45309; }
    .cover-stat.good  .value { color: #047857; }

    .cover-footer {
      margin-top: 44px; padding-top: 14px; border-top: 1px solid #cbd5e1;
      display: flex; justify-content: space-between; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.16em; color: #94a3b8;
    }

    /* SECTIONS */
    .section { page-break-before: always; padding: 24px 32px; }
    .section .eyebrow {
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em;
      color: #4f46e5; padding-bottom: 4px;
    }
    .section h2 {
      font-size: 22px; font-weight: 800; letter-spacing: -0.015em; color: #0f172a;
      padding-bottom: 8px; border-bottom: 2px solid #0f172a;
    }
    .section .lede {
      margin-top: 10px; font-size: 11px; color: #475569; max-width: 540px;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 16px; page-break-inside: auto; }
    table th {
      text-align: left; font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      padding: 8px 10px; color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    table td {
      padding: 8px 10px; border-bottom: 1px solid #f1f5f9;
      font-size: 11px; vertical-align: middle;
      page-break-inside: avoid;
    }
    table tr:nth-child(even) td { background: #fcfcfd; }
    table tr.tfoot td {
      font-weight: 700; border-top: 2px solid #0f172a; background: #f8fafc;
    }
    .tnum { font-variant-numeric: tabular-nums; }
    .num { text-align: right; }
    .badge {
      display: inline-block; padding: 1px 6px; border-radius: 4px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.02em;
    }
    .badge-W2       { background: #dbeafe; color: #1e40af; }
    .badge-Contract { background: #f3e8ff; color: #6b21a8; }
    .badge-1099     { background: #ccfbf1; color: #115e59; }
    .badge-Offshore { background: #fce7f3; color: #9d174d; }
    .badge-active   { background: #d1fae5; color: #065f46; }
    .badge-term     { background: #fee2e2; color: #991b1b; }
    .pill-red    { background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-amber  { background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-yellow { background: #fef9c3; color: #854d0e; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-sky    { background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }

    .bar {
      width: 100%; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
    }
    .bar > div { height: 100%; }

    .footer {
      margin-top: 24px; padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px; color: #94a3b8;
      display: flex; justify-content: space-between;
      text-transform: uppercase; letter-spacing: 0.1em;
    }
  `;

  const sectionShell = (eyebrow: string, title: string, lede: string, body: string) => `
    <div class="section">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p class="lede">${lede}</p>
      ${body}
      <div class="footer">
        <span>ZenHR · Workforce Brief</span>
        <span>Filed ${dateStr} · ${timeStr}</span>
      </div>
    </div>
  `;

  // Workforce section content
  const workforceBody = `
    <table>
      <thead>
        <tr><th>Class</th><th class="num">Total</th><th class="num">Active</th><th class="num">Terminated</th><th class="num">Share</th></tr>
      </thead>
      <tbody>
        ${(Object.keys(typeDist) as EmployeeType[]).map((t) => {
          const total = typeDist[t];
          const a = filtered.filter((e) => e.type === t && isActive(e)).length;
          const x = total - a;
          const share = filtered.length ? (total / filtered.length) * 100 : 0;
          return `<tr>
            <td><span class="badge badge-${t}">${TYPE_LABEL[t]}</span></td>
            <td class="num tnum">${total}</td>
            <td class="num tnum">${a}</td>
            <td class="num tnum">${x}</td>
            <td class="num tnum">${share.toFixed(1)}%</td>
          </tr>`;
        }).join('')}
        <tr class="tfoot">
          <td>Total</td>
          <td class="num tnum">${filtered.length}</td>
          <td class="num tnum">${metrics.active}</td>
          <td class="num tnum">${metrics.terminated}</td>
          <td class="num tnum">100%</td>
        </tr>
      </tbody>
    </table>

    ${topStates.length > 0 ? `
      <h3 style="margin-top:24px; font-size: 13px; font-weight: 700; color: #0f172a;">Top States</h3>
      <table>
        <thead><tr><th>Rank</th><th>State</th><th class="num">Employees</th><th class="num">Share</th></tr></thead>
        <tbody>
          ${topStates.map(([state, count], i) => {
            const share = filtered.length ? (count / filtered.length) * 100 : 0;
            return `<tr>
              <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
              <td>${state}</td>
              <td class="num tnum">${count}</td>
              <td class="num tnum">${share.toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : ''}
  `;

  // Compliance
  const complianceBody = expiring.length === 0 ? `
    <p style="margin-top:18px; padding: 14px; background: #d1fae5; color: #065f46; border-radius: 8px; font-size: 11px;">
      ✓ No upcoming or expired work authorizations in the next 90 days for the filtered workforce.
    </p>
  ` : `
    <table>
      <thead>
        <tr><th>Employee</th><th>Class</th><th>Authorization</th><th>Expiry</th><th>Status</th><th>State</th></tr>
      </thead>
      <tbody>
        ${expiring.slice(0, 60).map((e) => {
          const exp = new Date((e as { expiryDate?: string }).expiryDate!);
          const wa = (e as { workAuthorization?: string }).workAuthorization;
          const days = differenceInDays(exp, now);
          const pill = days < 0 ? `<span class="pill-red">${Math.abs(days)}d overdue</span>`
            : days <= 30 ? `<span class="pill-amber">${days}d left</span>`
            : days <= 60 ? `<span class="pill-yellow">${days}d left</span>`
            : `<span class="pill-sky">${days}d left</span>`;
          return `<tr>
            <td>
              <div style="font-weight: 600;">${e.name}</div>
              <div style="font-size: 10px; color: #64748b;">${e.position || '—'}</div>
            </td>
            <td><span class="badge badge-${e.type}">${TYPE_LABEL[e.type]}</span></td>
            <td>${wa || '—'}</td>
            <td>${format(exp, 'MMM d, yyyy')}</td>
            <td>${pill}</td>
            <td>${e.state || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${expiring.length > 60 ? `<p style="margin-top:8px; font-size: 9px; color: #94a3b8;">Showing 60 of ${expiring.length}. Export CSV for the full list.</p>` : ''}

    ${topAuth.length > 0 ? `
      <h3 style="margin-top:24px; font-size: 13px; font-weight: 700; color: #0f172a;">Authorization Mix</h3>
      <table>
        <thead><tr><th>Authorization</th><th class="num">Count</th><th class="num">Share</th></tr></thead>
        <tbody>
          ${topAuth.map(([auth, count]) => {
            const share = filtered.length ? (count / filtered.length) * 100 : 0;
            return `<tr>
              <td>${auth}</td>
              <td class="num tnum">${count}</td>
              <td class="num tnum">${share.toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : ''}
  `;

  // Financial
  const financialBody = `
    <table>
      <thead>
        <tr><th>Class</th><th class="num">Active</th><th class="num">Billable</th><th class="num">Monthly run-rate</th></tr>
      </thead>
      <tbody>
        ${(Object.keys(typeDist) as EmployeeType[]).map((t) => {
          const a = filtered.filter((e) => e.type === t && isActive(e));
          const billable = a.filter((e) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B');
          const rev = billable.reduce((s, e) => s + monthlyPay(e), 0);
          return `<tr>
            <td><span class="badge badge-${t}">${TYPE_LABEL[t]}</span></td>
            <td class="num tnum">${a.length}</td>
            <td class="num tnum">${billable.length}</td>
            <td class="num tnum" style="font-weight:700; color:#047857">${fullCurrency(rev)}</td>
          </tr>`;
        }).join('')}
        <tr class="tfoot">
          <td>Total · ${metrics.utilization}% utilization</td>
          <td class="num tnum">${metrics.active}</td>
          <td class="num tnum">${metrics.billable}</td>
          <td class="num tnum" style="color:#047857">${fullCurrency(metrics.revenue)}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Network
  const networkBody = `
    ${topClients.length > 0 ? `
      <h3 style="margin-top:8px; font-size: 13px; font-weight: 700; color: #0f172a;">Top Clients</h3>
      <table>
        <thead><tr><th>Rank</th><th>Client</th><th class="num">Placements</th></tr></thead>
        <tbody>
          ${topClients.map((c, i) => `<tr>
            <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
            <td>${c.name}</td>
            <td class="num tnum">${c.count}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
    ${topVendors.length > 0 ? `
      <h3 style="margin-top:18px; font-size: 13px; font-weight: 700; color: #0f172a;">Top Vendors</h3>
      <table>
        <thead><tr><th>Rank</th><th>Vendor</th><th class="num">Placements</th></tr></thead>
        <tbody>
          ${topVendors.map((v, i) => `<tr>
            <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
            <td>${v.name}</td>
            <td class="num tnum">${v.count}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
    ${topClients.length === 0 && topVendors.length === 0 ? '<p style="margin-top:14px; color:#64748b; font-size:11px;">No client or vendor placements in the filtered scope.</p>' : ''}
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>ZenHR · Workforce Report · ${dateStr}</title>
      <style>${css}</style>
    </head>
    <body>
      <!-- COVER -->
      <div class="cover">
        <div class="brand">
          <span class="brand-mark">Z</span>
          <div class="brand-info">
            <p>ZenHR</p>
            <p>Workforce Operations Platform</p>
          </div>
        </div>

        <h1 class="cover-title">Workforce<br/>Report.</h1>
        <p class="cover-sub">
          A snapshot of headcount, compliance, financial standing and network exposure across
          ${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'employee' : 'employees'} on the books as of ${dateStr}.
        </p>

        <div class="cover-meta">
          <span class="chip">As of ${dateStr}</span>
          <span class="chip">${filtered.length.toLocaleString()} records</span>
          ${activeFilters.map((f) => `<span class="chip">${f}</span>`).join('')}
        </div>

        <div class="cover-grid">
          <div class="cover-stat"><div class="label">Headcount</div><div class="value">${metrics.total.toLocaleString()}</div><div class="sub">${metrics.active} active · ${metrics.terminated} terminated</div></div>
          <div class="cover-stat good"><div class="label">Monthly run-rate</div><div class="value">${compactCurrency(metrics.revenue)}</div><div class="sub">${metrics.billable} billable employees</div></div>
          <div class="cover-stat"><div class="label">Utilization</div><div class="value">${metrics.utilization}%</div><div class="sub">billable ÷ active</div></div>
          <div class="cover-stat ${metrics.expired > 0 ? 'alert' : ''}"><div class="label">Expired auths</div><div class="value">${metrics.expired}</div><div class="sub">renew immediately</div></div>
          <div class="cover-stat ${metrics.b30 > 0 ? 'warn' : ''}"><div class="label">Expire in 30 days</div><div class="value">${metrics.b30}</div><div class="sub">${metrics.b60 + metrics.b90} more in 31–90d</div></div>
          <div class="cover-stat"><div class="label">Avg tenure</div><div class="value">${metrics.avgTenureYears !== null ? metrics.avgTenureYears + 'y' : '—'}</div><div class="sub">years of service</div></div>
        </div>

        <div class="cover-footer">
          <span>Filed ${dateStr} · ${timeStr}</span>
          <span>Confidential · Internal use only</span>
        </div>
      </div>

      ${sectionShell('Section I', 'Workforce composition', 'How your workforce breaks down by employment class and geography.', workforceBody)}
      ${sectionShell('Section II', 'Compliance & risk', 'Work authorization status and renewal pipeline for the next 90 days.', complianceBody)}
      ${sectionShell('Section III', 'Financial snapshot', 'Monthly billable run-rate by employment class.', financialBody)}
      ${sectionShell('Section IV', 'Client & vendor network', 'Where your placements are concentrated.', networkBody)}

      <script>window.onload = () => { setTimeout(() => window.print(), 220); };</script>
    </body>
    </html>
  `;
}
