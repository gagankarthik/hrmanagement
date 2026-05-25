'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DonutChart, CompareBarChart, TrendAreaChart, TYPE_COLOR, VIZ } from '@/components/dashboard/Charts';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useLeaves } from '@/context/LeaveContext';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { resolveName } from '@/lib/names';
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
  const { clients, fetchClients } = useClients();
  const { vendors, fetchVendors } = useVendors();
  const { user } = useAuth();

  // Ensure client/vendor names are available so the dashboard never shows raw IDs
  useEffect(() => {
    fetchClients();
    fetchVendors();
  }, [fetchClients, fetchVendors]);
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [selectedRevenue, setSelectedRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // id -> name lookups so we resolve real names instead of showing raw IDs
  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => { if (c?.id) m.set(c.id, c.name || 'Unnamed client'); });
    return m;
  }, [clients]);

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    vendors.forEach((v) => { if (v?.id) m.set(v.id, v.name || 'Unnamed vendor'); });
    return m;
  }, [vendors]);

  // Only real, resolvable clients/vendors populate the filter dropdowns
  const uniqueClients = useMemo(() => {
    const ids = new Set<string>();
    employees.forEach((e) => {
      e.clientAssignments?.forEach((a) => { if (a.clientId) ids.add(a.clientId); });
      if (e.clientId) ids.add(e.clientId);
    });
    return Array.from(ids)
      .filter((id) => clientMap.has(id))
      .map((id) => ({ id, name: clientMap.get(id) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, clientMap]);

  const uniqueVendors = useMemo(() => {
    const ids = new Set<string>();
    employees.forEach((e) => {
      e.vendorAssignments?.forEach((a) => { if (a.vendorId) ids.add(a.vendorId); });
      if (e.vendorId) ids.add(e.vendorId);
    });
    return Array.from(ids)
      .filter((id) => vendorMap.has(id))
      .map((id) => ({ id, name: vendorMap.get(id) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, vendorMap]);

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

  // Top clients/vendors — resolve IDs to names, fold in legacy text names, never surface a raw ID
  const topClients = useMemo(() => {
    const dist: Record<string, { id: string; name: string; count: number }> = {};
    filteredEmployees.forEach((e) => {
      const ids = (e.clientAssignments?.map((a) => a.clientId).filter(Boolean) as string[] | undefined);
      const list = Array.from(new Set(ids && ids.length ? ids : (e.clientId ? [e.clientId] : [])));
      const refs = list.length
        ? list.map((id) => {
            const known = clientMap.has(id);
            const name = clientMap.get(id) || e.client || 'Unknown client';
            // Unknown/legacy refs collapse into one bucket per name (avoids duplicate rows)
            return { key: known ? id : `name:${name.toLowerCase()}`, id: known ? id : '', name };
          })
        : (e.client ? [{ key: `name:${e.client.toLowerCase()}`, id: '', name: e.client }] : []);
      refs.forEach(({ key, id, name }) => {
        if (!dist[key]) dist[key] = { id, name, count: 0 };
        dist[key].count += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEmployees, clientMap]);

  const topVendors = useMemo(() => {
    const dist: Record<string, { id: string; name: string; count: number }> = {};
    filteredEmployees.forEach((e) => {
      const ids = (e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) as string[] | undefined);
      const list = Array.from(new Set(ids && ids.length ? ids : (e.vendorId ? [e.vendorId] : [])));
      const refs = list.length
        ? list.map((id) => {
            const known = vendorMap.has(id);
            const name = vendorMap.get(id) || e.vendorName || 'Unknown vendor';
            return { key: known ? id : `name:${name.toLowerCase()}`, id: known ? id : '', name };
          })
        : (e.vendorName ? [{ key: `name:${e.vendorName.toLowerCase()}`, id: '', name: e.vendorName }] : []);
      refs.forEach(({ key, id, name }) => {
        if (!dist[key]) dist[key] = { id, name, count: 0 };
        dist[key].count += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEmployees, vendorMap]);

  // ── Interactive chart data ──
  const typePie = useMemo(
    () => typeDistribution.filter((t) => t.value > 0).map((t) => ({ name: t.label, value: t.value, color: TYPE_COLOR[t.label] || VIZ.slate })),
    [typeDistribution]
  );

  const statusPie = useMemo(
    () => [
      { name: 'Active', value: statusBreakdown.active, color: VIZ.emerald },
      { name: 'Terminated', value: statusBreakdown.terminated, color: VIZ.rose },
    ].filter((d) => d.value > 0),
    [statusBreakdown]
  );

  const billableByType = useMemo(
    () => (['W2', 'Contract', '1099', 'Offshore'] as const).map((type) => {
      const list = filteredEmployees.filter((e) => e.type === type);
      const billable = list.filter((e) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B').length;
      return { type, Billable: billable, 'Non-billable': list.length - billable };
    }),
    [filteredEmployees]
  );

  const hiringTrend = useMemo(() => {
    const now = new Date();
    const mn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const rows: { month: string; W2: number; Contract: number; '1099': number; Offshore: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthEmps = filteredEmployees.filter((e) => {
        if (!e.hireDate) return false;
        const h = new Date(e.hireDate);
        return h >= start && h < end;
      });
      rows.push({
        month: mn[start.getMonth()],
        W2: monthEmps.filter((e) => e.type === 'W2').length,
        Contract: monthEmps.filter((e) => e.type === 'Contract').length,
        '1099': monthEmps.filter((e) => e.type === '1099').length,
        Offshore: monthEmps.filter((e) => e.type === 'Offshore').length,
      });
    }
    return rows;
  }, [filteredEmployees]);

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
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Overview"
        title={greeting}
        description={
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Workforce overview — {format(now, 'EEEE, MMMM d, yyyy')}
          </span>
        }
        actions={
          <>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                showFilters || hasActiveFilters
                  ? 'btn-primary'
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
          </>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <div className="surface p-5 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* Distribution & trends — interactive charts */}
      <section className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Workforce by type" subtitle={`${totalHeadcount} employees`} icon={Users} delay={40}>
          {typePie.length ? (
            <DonutChart data={typePie} />
          ) : (
            <EmptyState title="No employees match" description="Adjust filters to see the breakdown." />
          )}
        </ChartCard>

        <ChartCard
          title="Hiring trend"
          subtitle="New hires by category · last 12 months"
          icon={TrendingUp}
          delay={100}
          className="lg:col-span-2"
        >
          <TrendAreaChart
            data={hiringTrend}
            xKey="month"
            areas={[
              { key: 'W2', name: 'W-2', color: TYPE_COLOR.W2 },
              { key: 'Contract', name: 'Contract', color: TYPE_COLOR.Contract },
              { key: '1099', name: '1099', color: TYPE_COLOR['1099'] },
              { key: 'Offshore', name: 'Offshore', color: TYPE_COLOR.Offshore },
            ]}
          />
        </ChartCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Employment status" subtitle="active vs terminated" icon={Briefcase} delay={40}>
          {statusPie.length ? (
            <DonutChart data={statusPie} />
          ) : (
            <EmptyState title="No status data" description="No employees with status match the filters." />
          )}
        </ChartCard>

        <ChartCard title="Billable vs non-billable" subtitle="by employment type" icon={DollarSign} delay={100}>
          <CompareBarChart
            data={billableByType}
            xKey="type"
            bars={[
              { key: 'Billable', name: 'Billable', color: VIZ.emerald },
              { key: 'Non-billable', name: 'Non-billable', color: VIZ.slate },
            ]}
          />
        </ChartCard>
      </section>

      {/* Top clients + vendors */}
      <section className="grid gap-6 lg:grid-cols-2">
        <TopList title="Top clients" icon={Building2} tone="emerald" items={topClients} basePath="/dashboard/clients" total={totalHeadcount} />
        <TopList title="Top vendors" icon={Package}    tone="purple"  items={topVendors} basePath="/dashboard/vendors" total={totalHeadcount} />
      </section>

      {/* Leaves & attendance */}
      <section className="grid gap-5 lg:grid-cols-2">
        <LeavesCard />
        <AttendanceCard />
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
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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
        <span className="font-display text-3xl font-bold tabular-nums text-slate-900">{pct}%</span>
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
  total,
}: {
  title: string;
  icon: React.ElementType;
  tone: 'emerald' | 'purple';
  items: TopListItem[];
  basePath: string;
  total: number;
}) {
  const accent = tone === 'emerald'
    ? { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', bar: 'from-emerald-400 to-emerald-600', avatar: 'bg-emerald-100 text-emerald-700', rank: 'bg-emerald-600' }
    : { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', bar: 'from-purple-400 to-brand-600', avatar: 'bg-purple-100 text-purple-700', rank: 'bg-purple-600' };
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="surface">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accent.iconBg)}>
            <Icon className={cn('h-4 w-4', accent.iconColor)} />
          </div>
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span>
          )}
        </div>
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="p-3 sm:p-4">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">No assignments yet.</p>
        ) : (
          <ol className="space-y-1">
            {items.map((item, idx) => {
              const sharePct = total ? Math.round((item.count / total) * 100) : 0;
              return (
                <li key={item.id || `${item.name}-${idx}`}>
                  <Link
                    href={item.id ? `${basePath}/${item.id}` : basePath}
                    className="group -mx-1 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <span className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums',
                      idx === 0 ? cn(accent.rank, 'text-white') : 'bg-slate-100 text-slate-500'
                    )}>
                      {idx + 1}
                    </span>
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold', accent.avatar)}>
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-slate-500">
                          <span className="font-bold tabular-nums text-slate-900">{item.count}</span> · {sharePct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full bg-gradient-to-r transition-all', accent.bar)}
                          style={{ width: `${(item.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function WidgetCard({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
            <Icon className="h-4 w-4 text-brand-700" />
          </div>
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LeavesCard() {
  const { leaves } = useLeaves();
  const { employees } = useEmployees();
  const counts: Record<string, number> = { Pending: 0, Approved: 0, Rejected: 0 };
  leaves.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
  const total = leaves.length;
  const todayStr = new Date().toLocaleDateString('en-CA');
  const upcoming = leaves
    .filter((l) => l.status === 'Approved' && l.startDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);
  const seg = [
    { k: 'Pending', c: counts.Pending, bar: 'bg-amber-400', text: 'text-amber-700', dot: 'bg-amber-400' },
    { k: 'Approved', c: counts.Approved, bar: 'bg-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { k: 'Rejected', c: counts.Rejected, bar: 'bg-red-400', text: 'text-red-700', dot: 'bg-red-400' },
  ];

  return (
    <WidgetCard title="Leave requests" icon={CalendarDays} href="/dashboard/leaves">
      {total === 0 ? (
        <p className="py-5 text-center text-sm text-slate-400">No leave requests yet.</p>
      ) : (
        <>
          <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-black/[0.03]">
            {seg.filter((s) => s.c > 0).map((s) => (
              <div key={s.k} className={cn('h-full', s.bar)} style={{ width: `${(s.c / total) * 100}%` }} title={`${s.k}: ${s.c}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {seg.map((s) => (
              <div key={s.k} className="rounded-lg bg-slate-50 px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                  <span className="text-[11px] font-medium text-slate-500">{s.k}</span>
                </div>
                <p className={cn('mt-0.5 font-display text-lg font-bold', s.text)}>{s.c}</p>
              </div>
            ))}
          </div>
          {upcoming.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Upcoming approved</p>
              <ul className="space-y-1.5">
                {upcoming.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-slate-700">
                      {resolveName(l.employeeId, employees, { unknown: 'Unknown employee' })}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {l.startDate}{l.endDate && l.endDate !== l.startDate ? ` → ${l.endDate}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
}

function AttendanceCard() {
  const { records } = useAttendance();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todays = records.filter((r) => r.date === todayStr);
  const counts: Record<string, number> = { Present: 0, Remote: 0, 'Half-day': 0, Absent: 0, Leave: 0 };
  todays.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const total = todays.length;
  const presentish = counts.Present + counts.Remote + counts['Half-day'];
  const rate = total ? Math.round((presentish / total) * 100) : 0;
  const seg = [
    { k: 'Present', c: counts.Present, text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { k: 'Remote', c: counts.Remote, text: 'text-sky-700', dot: 'bg-sky-500' },
    { k: 'Half-day', c: counts['Half-day'], text: 'text-amber-700', dot: 'bg-amber-400' },
    { k: 'Absent', c: counts.Absent, text: 'text-red-700', dot: 'bg-red-400' },
  ];

  return (
    <WidgetCard title="Attendance today" icon={CalendarCheck} href="/dashboard/attendance">
      {total === 0 ? (
        <p className="py-5 text-center text-sm text-slate-400">No attendance logged today.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="font-display text-3xl font-bold text-slate-900">{rate}%</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">present</span>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {seg.map((s) => (
              <div key={s.k} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={cn('h-2 w-2 rounded-full', s.dot)} />{s.k}
                </span>
                <span className={cn('font-display text-sm font-bold', s.text)}>{s.c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'surface surface-hover p-4 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] sm:p-5',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
          <Icon className="h-[18px] w-[18px] text-brand-600" />
        </div>
      </div>
      {children}
    </div>
  );
}
