'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  X,
  Building2,
  Package,
  ChevronRight,
  RefreshCw,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { EmployeeType } from '@/types/employee';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import AttentionPanel from '@/components/dashboard/AttentionPanel';
import MetricsStrip from '@/components/dashboard/MetricsStrip';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MilestonesPanel from '@/components/dashboard/MilestonesPanel';
import WorkforceInsights from '@/components/dashboard/WorkforceInsights';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

const employeeTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'W2', label: 'W2' },
  { value: 'Contract', label: 'Contract' },
  { value: '1099', label: '1099' },
  { value: 'Offshore', label: 'Offshore' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Terminated', label: 'Terminated' },
];

const revenueOptions = [
  { value: 'all', label: 'All Revenue' },
  { value: 'B', label: 'Billable' },
  { value: 'NB', label: 'Non-Billable' },
];

const typeAccent: Record<string, string> = {
  W2: 'bg-blue-500',
  Contract: 'bg-purple-500',
  '1099': 'bg-teal-500',
  Offshore: 'bg-pink-500',
};

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { employees, isLoading, fetchEmployees } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [selectedRevenue, setSelectedRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const uniqueClients = useMemo(() => {
    const ids = new Set<string>();
    employees.forEach((e) => {
      e.clientAssignments?.forEach((a) => { if (a.clientId) ids.add(a.clientId); });
      if (e.clientId) ids.add(e.clientId);
    });
    return Array.from(ids)
      .map((id) => ({ id, name: clients.find((c) => c.id === id)?.name || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, clients]);

  const uniqueVendors = useMemo(() => {
    const ids = new Set<string>();
    employees.forEach((e) => {
      e.vendorAssignments?.forEach((a) => { if (a.vendorId) ids.add(a.vendorId); });
      if (e.vendorId) ids.add(e.vendorId);
    });
    return Array.from(ids)
      .map((id) => ({ id, name: vendors.find((v) => v.id === id)?.name || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, vendors]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedType !== 'all' && emp.type !== selectedType) return false;
      if (selectedStatus !== 'all' && 'status' in emp && emp.status !== selectedStatus) return false;
      if (selectedRevenue !== 'all' && 'revenueStatus' in emp && emp.revenueStatus !== selectedRevenue) return false;
      if (selectedClient !== 'all') {
        const ids = emp.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (emp.clientId ? [emp.clientId] : []);
        if (!ids.includes(selectedClient)) return false;
      }
      if (selectedVendor !== 'all') {
        const ids = emp.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (emp.vendorId ? [emp.vendorId] : []);
        if (!ids.includes(selectedVendor)) return false;
      }
      return true;
    });
  }, [employees, selectedType, selectedStatus, selectedRevenue, selectedClient, selectedVendor]);

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedRevenue !== 'all' ||
    selectedClient !== 'all' ||
    selectedVendor !== 'all';

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedRevenue('all');
    setSelectedClient('all');
    setSelectedVendor('all');
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try { await fetchEmployees(); } finally { setIsRefreshing(false); }
  };

  // Headcount by type
  const typeDistribution = useMemo(() => {
    const map: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
    filteredEmployees.forEach((e) => { map[e.type] += 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value })) as { label: EmployeeType; value: number }[];
  }, [filteredEmployees]);

  const totalHeadcount = filteredEmployees.length;
  const maxTypeValue = Math.max(...typeDistribution.map((t) => t.value), 1);

  // Status donut
  const statusBreakdown = useMemo(() => {
    let active = 0, terminated = 0;
    filteredEmployees.forEach((e) => {
      if ('status' in e) {
        if ((e as { status: string }).status === 'Active') active += 1;
        else if ((e as { status: string }).status === 'Terminated') terminated += 1;
      }
    });
    return { active, terminated, total: active + terminated };
  }, [filteredEmployees]);

  // Top clients/vendors
  const topClients = useMemo(() => {
    const dist: Record<string, { id: string; name: string; count: number }> = {};
    filteredEmployees.forEach((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []);
      ids.forEach((id) => {
        const name = clients.find((c) => c.id === id)?.name || id;
        if (!dist[id]) dist[id] = { id, name, count: 0 };
        dist[id].count += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEmployees, clients]);

  const topVendors = useMemo(() => {
    const dist: Record<string, { id: string; name: string; count: number }> = {};
    filteredEmployees.forEach((e) => {
      const ids = e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []);
      ids.forEach((id) => {
        const name = vendors.find((v) => v.id === id)?.name || id;
        if (!dist[id]) dist[id] = { id, name, count: 0 };
        dist[id].count += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEmployees, vendors]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const now = new Date();
  const firstName = (user?.name || user?.username || user?.email || '').split(/[ @]/)[0] || 'there';
  const greeting = `${greetingForHour(now.getHours())}, ${firstName.charAt(0).toUpperCase() + firstName.slice(1)}`;

  return (
    <div className="space-y-6">
      {/* Clean header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Workforce overview — {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
              showFilters || hasActiveFilters
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {[selectedType !== 'all', selectedStatus !== 'all', selectedRevenue !== 'all', selectedClient !== 'all', selectedVendor !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Type" value={selectedType} onChange={(v) => setSelectedType(v as EmployeeType | 'all')} options={employeeTypes} />
            <FilterSelect label="Status" value={selectedStatus} onChange={(v) => setSelectedStatus(v as 'Active' | 'Terminated' | 'all')} options={statusOptions} />
            <FilterSelect label="Revenue" value={selectedRevenue} onChange={(v) => setSelectedRevenue(v as 'B' | 'NB' | 'all')} options={revenueOptions} />
            <FilterSelect label="Client" value={selectedClient} onChange={setSelectedClient}
              options={[{ value: 'all', label: 'All Clients' }, ...uniqueClients.map((c) => ({ value: c.id, label: c.name }))]} />
            <FilterSelect label="Vendor" value={selectedVendor} onChange={setSelectedVendor}
              options={[{ value: 'all', label: 'All Vendors' }, ...uniqueVendors.map((v) => ({ value: v.id, label: v.name }))]} />
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                {filteredEmployees.length} of {employees.length} employees shown
              </span>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attention */}
      <AttentionPanel employees={filteredEmployees} />

      {/* Metrics strip */}
      <MetricsStrip employees={filteredEmployees} />

      {/* Headcount distribution */}
      <section className="grid gap-6 lg:grid-cols-5">
        {/* By type */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Headcount by type</h2>
              <p className="mt-0.5 text-xs text-slate-500">{totalHeadcount} total employees</p>
            </div>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          {totalHeadcount === 0 ? (
            <EmptyState title="No employees match" description="Adjust filters to see distribution." />
          ) : (
            <ul className="space-y-3">
              {typeDistribution.map((t) => {
                const pct = totalHeadcount ? (t.value / totalHeadcount) * 100 : 0;
                return (
                  <li key={t.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', typeAccent[t.label])} />
                        <span className="font-medium text-slate-700">{t.label}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {t.value}
                        <span className="ml-1.5 text-slate-400">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full transition-all', typeAccent[t.label])}
                        style={{ width: `${(t.value / maxTypeValue) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Status donut */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Status</h2>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
          {statusBreakdown.total === 0 ? (
            <EmptyState title="No status data" description="No employees with status info match the current filters." />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <StatusDonut active={statusBreakdown.active} terminated={statusBreakdown.terminated} />
              <div className="grid w-full grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </div>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-900">{statusBreakdown.active}</p>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                    <XCircle className="h-3 w-3" /> Terminated
                  </div>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-red-900">{statusBreakdown.terminated}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top clients + vendors */}
      <section className="grid gap-6 lg:grid-cols-2">
        <TopList title="Top clients" icon={Building2} tone="emerald" items={topClients} basePath="/dashboard/clients" />
        <TopList title="Top vendors" icon={Package}    tone="purple"  items={topVendors} basePath="/dashboard/vendors" />
      </section>

      {/* Workforce insights — compliance, hiring trend, tenure */}
      <WorkforceInsights employees={filteredEmployees} />

      {/* Upcoming milestones — birthdays + anniversaries */}
      <MilestonesPanel employees={filteredEmployees} />

      {/* Recent activity */}
      <RecentActivity employees={filteredEmployees} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function StatusDonut({ active, terminated }: { active: number; terminated: number }) {
  const total = active + terminated || 1;
  const size = 140;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const activeLen = (active / total) * circumference;
  const terminatedLen = (terminated / total) * circumference;
  const pct = Math.round((active / total) * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-slate-100" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          className="stroke-emerald-500" strokeWidth={stroke}
          strokeDasharray={`${activeLen} ${circumference}`} strokeLinecap="round"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          className="stroke-red-400" strokeWidth={stroke}
          strokeDasharray={`${terminatedLen} ${circumference}`}
          strokeDashoffset={-activeLen} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900">{pct}%</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">active</span>
      </div>
    </div>
  );
}

interface TopListItem { id: string; name: string; count: number }

function TopList({
  title,
  icon: Icon,
  tone,
  items,
  basePath,
}: {
  title: string;
  icon: React.ElementType;
  tone: 'emerald' | 'purple';
  items: TopListItem[];
  basePath: string;
}) {
  const accent = tone === 'emerald'
    ? { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', bar: 'bg-emerald-500' }
    : { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', bar: 'bg-purple-500' };
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accent.iconBg)}>
            <Icon className={cn('h-4 w-4', accent.iconColor)} />
          </div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.id ? `${basePath}/${item.id}` : basePath} className="group block">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all', accent.bar)}
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
