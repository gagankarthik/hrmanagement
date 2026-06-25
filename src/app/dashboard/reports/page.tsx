'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3, Download, Users, Filter, X, DollarSign,
  Shield, Activity, Award, UserCheck, AlertTriangle,
  AlertOctagon, Printer, Building2,
} from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmployeeType } from '@/types/employee';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { isActive, monthlyPay, compactCurrency, downloadCSV } from './_components/shared';
import { SummaryStat, FilterSelect } from './_components/report-cards';
import { buildPdfHtml } from './_components/pdf';
import { WorkforceTab } from './_components/WorkforceTab';
import { ComplianceTab } from './_components/ComplianceTab';
import { FinancialTab } from './_components/FinancialTab';
import { ActivityTab } from './_components/ActivityTab';
import { NetworkTab } from './_components/NetworkTab';

type TabId = 'workforce' | 'compliance' | 'financial' | 'activity' | 'network';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'workforce',  label: 'Workforce',  icon: Users },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'financial',  label: 'Financial',  icon: DollarSign },
  { id: 'activity',   label: 'Activity',   icon: Activity },
  { id: 'network',    label: 'Network',    icon: Building2 },
];

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
    <PageContainer>
      {/* HEADER */}
      <PageHeader
        icon={BarChart3}
        eyebrow="Reporting"
        title="Workforce Reports"
        tone="brand"
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
          <SummaryStat icon={Users} label="Headcount" value={metrics.total.toLocaleString()} sub={`${metrics.active} active`} tone="brand" />
          <SummaryStat icon={DollarSign} label="Run-rate" value={compactCurrency(metrics.revenue)} sub="monthly billable" tone="emerald" />
          <SummaryStat icon={UserCheck} label="Utilization" value={`${metrics.utilization}%`} sub={`${metrics.billable} billable`} tone="purple" />
          <SummaryStat icon={AlertOctagon} label="Expired" value={`${metrics.expired}`} sub="work auths" tone={metrics.expired > 0 ? 'red' : 'slate'} />
          <SummaryStat icon={AlertTriangle} label="Expire 30d" value={`${metrics.b30}`} sub="renewals due" tone={metrics.b30 > 0 ? 'amber' : 'slate'} />
          <SummaryStat icon={Award} label="Avg tenure" value={metrics.avgTenureYears !== null ? `${metrics.avgTenureYears}y` : '—'} sub="years of service" tone="sky" />
        </div>
      </section>

      {/* TAB SWITCHER — underline bar (no boxed card) */}
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max items-center gap-1" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isTabActive}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
                  isTabActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {t.label}
                {isTabActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-brand-600" />}
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
    </PageContainer>
  );
}
