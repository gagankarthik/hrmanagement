'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  X,
  Users,
  TrendingUp,
  Building2,
  ChevronRight,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Activity,
  DollarSign,
  UserPlus,
  UserMinus,
  Briefcase,
  MapPin,
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Layers,
  Eye,
  Cake,
  Award,
  Package
} from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format } from 'date-fns';
import { EmployeeType, Employee } from '@/types/employee';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  { value: 'all', label: 'All' },
  { value: 'B', label: 'Billable' },
  { value: 'NB', label: 'Non-Billable' },
];

// Custom Chart Components
function DonutChart({ data, colors }: { data: { label: string; value: number; color?: string }[]; colors?: string[] }) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let currentAngle = 0;

  const defaultColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec489a'];

  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
          <circle cx="90" cy="90" r="70" fill="none" stroke="currentColor" strokeWidth="40" className="text-slate-200 dark:text-slate-700" />
          <circle cx="90" cy="90" r="45" fill="white" className="dark:fill-slate-800" />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
        {data.filter(item => item.value > 0).map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = startAngle + angle;
          currentAngle = endAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = 90 + 70 * Math.cos(startRad);
          const y1 = 90 + 70 * Math.sin(startRad);
          const x2 = 90 + 70 * Math.cos(endRad);
          const y2 = 90 + 70 * Math.sin(endRad);

          const largeArc = angle > 180 ? 1 : 0;

          const pathData = `M 90 90 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || (colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length])}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
        <circle cx="90" cy="90" r="45" fill="white" className="dark:fill-slate-800" />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{total}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, color }: { data: { label: string; value: number }[] | [string, number][]; color: string }) {
  // Normalize data format
  const normalizedData = Array.isArray(data[0])
    ? (data as [string, number][]).map(([label, value]) => ({ label, value }))
    : data as { label: string; value: number }[];

  const maxValue = Math.max(...normalizedData.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {normalizedData.map((item, index) => (
        <div key={index} className="group">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="text-slate-900 dark:text-white font-semibold">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { employees, isLoading, stats } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [selectedRevenue, setSelectedRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');

  const uniqueClients = useMemo(() => {
    const clientIds = new Set<string>();
    employees.forEach((emp) => {
      if (emp.clientAssignments?.length) {
        emp.clientAssignments.forEach((a) => { if (a.clientId) clientIds.add(a.clientId); });
      } else if (emp.clientId) {
        clientIds.add(emp.clientId);
      }
    });
    return Array.from(clientIds)
      .map((id) => ({ id, name: clients.find((c) => c.id === id)?.name || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, clients]);

  const uniqueVendors = useMemo(() => {
    const vendorIds = new Set<string>();
    employees.forEach((emp) => {
      if (emp.vendorAssignments?.length) {
        emp.vendorAssignments.forEach((a) => { if (a.vendorId) vendorIds.add(a.vendorId); });
      } else if (emp.vendorId) {
        vendorIds.add(emp.vendorId);
      }
    });
    return Array.from(vendorIds)
      .map((id) => ({ id, name: vendors.find((v) => v.id === id)?.name || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, vendors]);

  const clientData = useMemo(() => {
    const distribution: Record<string, { employees: Employee[]; clientId: string; name: string }> = {};
    employees.forEach((emp) => {
      const clientIds = emp.clientAssignments?.map((a) => a.clientId).filter(Boolean)
        || (emp.clientId ? [emp.clientId] : []);
      clientIds.forEach((clientId) => {
        const client = clients.find((c) => c.id === clientId);
        const name = client?.name || emp.client || clientId;
        if (!distribution[clientId]) distribution[clientId] = { employees: [], clientId, name };
        if (!distribution[clientId].employees.find((e) => e.id === emp.id)) {
          distribution[clientId].employees.push(emp);
        }
      });
      // Legacy text-only employees
      if (clientIds.length === 0 && emp.client) {
        const key = `legacy-${emp.client}`;
        if (!distribution[key]) distribution[key] = { employees: [], clientId: '', name: emp.client };
        distribution[key].employees.push(emp);
      }
    });
    return Object.values(distribution)
      .sort((a, b) => b.employees.length - a.employees.length)
      .slice(0, 6);
  }, [employees, clients]);

  const vendorData = useMemo(() => {
    const distribution: Record<string, { employees: Employee[]; vendorId: string; name: string }> = {};
    employees.forEach((emp) => {
      const vendorIds = emp.vendorAssignments?.map((a) => a.vendorId).filter(Boolean)
        || (emp.vendorId ? [emp.vendorId] : []);
      vendorIds.forEach((vendorId) => {
        const vendor = vendors.find((v) => v.id === vendorId);
        const name = vendor?.name || emp.vendorName || vendorId;
        if (!distribution[vendorId]) distribution[vendorId] = { employees: [], vendorId, name };
        if (!distribution[vendorId].employees.find((e) => e.id === emp.id)) {
          distribution[vendorId].employees.push(emp);
        }
      });
      if (vendorIds.length === 0 && emp.vendorName) {
        const key = `legacy-${emp.vendorName}`;
        if (!distribution[key]) distribution[key] = { employees: [], vendorId: '', name: emp.vendorName };
        distribution[key].employees.push(emp);
      }
    });
    return Object.values(distribution)
      .sort((a, b) => b.employees.length - a.employees.length)
      .slice(0, 6);
  }, [employees, vendors]);

  // Enhanced analytics data
  const typeDistribution = useMemo(() => {
    const distribution: Record<EmployeeType, number> = {
      W2: 0,
      Contract: 0,
      '1099': 0,
      Offshore: 0
    };
    employees.forEach((emp) => {
      distribution[emp.type]++;
    });
    return Object.entries(distribution).map(([label, value]) => ({ label, value }));
  }, [employees]);

  const stateDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.state) {
        distribution[emp.state] = (distribution[emp.state] || 0) + 1;
      }
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [employees]);

  const revenueDistribution = useMemo(() => {
    let billable = 0;
    let nonBillable = 0;
    employees.forEach((emp) => {
      if ('revenueStatus' in emp) {
        if (emp.revenueStatus === 'B') billable++;
        else if (emp.revenueStatus === 'NB') nonBillable++;
      }
    });
    return [
      { label: 'Billable', value: billable, color: '#10b981' },
      { label: 'Non-Billable', value: nonBillable, color: '#f59e0b' }
    ];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedType !== 'all' && emp.type !== selectedType) return false;
      if (selectedStatus !== 'all') {
        if ('status' in emp && emp.status !== selectedStatus) return false;
      }
      if (selectedRevenue !== 'all') {
        if ('revenueStatus' in emp && emp.revenueStatus !== selectedRevenue) return false;
      }
      if (selectedClient !== 'all') {
        const empClientIds = emp.clientAssignments?.map((a) => a.clientId).filter(Boolean)
          || (emp.clientId ? [emp.clientId] : []);
        if (!empClientIds.includes(selectedClient) && emp.client !== selectedClient) return false;
      }
      if (selectedVendor !== 'all') {
        const empVendorIds = emp.vendorAssignments?.map((a) => a.vendorId).filter(Boolean)
          || (emp.vendorId ? [emp.vendorId] : []);
        if (!empVendorIds.includes(selectedVendor) && emp.vendorName !== selectedVendor) return false;
      }
      return true;
    });
  }, [employees, selectedType, selectedStatus, selectedRevenue, selectedClient, selectedVendor]);

  const hasActiveFilters = selectedType !== 'all' || selectedStatus !== 'all' || selectedRevenue !== 'all' || selectedClient !== 'all' || selectedVendor !== 'all';

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedRevenue('all');
    setSelectedClient('all');
    setSelectedVendor('all');
  };

  const handleClientClick = (clientId?: string, clientName?: string) => {
    if (clientId) {
      router.push(`/dashboard/clients/${clientId}`);
    }
  };

  const handleVendorClick = (vendorId?: string, vendorName?: string) => {
    if (vendorId) {
      router.push(`/dashboard/vendors/${vendorId}`);
    }
  };

  const recentHires = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return filteredEmployees
      .filter((emp) => new Date(emp.hireDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
      .slice(0, 5);
  }, [filteredEmployees]);

  const upcomingExpirations = useMemo(() => {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    return filteredEmployees
      .filter((emp) => {
        if (emp.type === 'Offshore') return false;
        if (!('expiryDate' in emp) || !emp.expiryDate) return false;
        const expiry = new Date(emp.expiryDate);
        return expiry > now && expiry <= ninetyDaysFromNow;
      })
      .sort((a, b) => {
        const aDate = 'expiryDate' in a ? new Date(a.expiryDate) : new Date();
        const bDate = 'expiryDate' in b ? new Date(b.expiryDate) : new Date();
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5);
  }, [filteredEmployees]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    return filteredEmployees.filter(e => {
      if (!e.dob) return false;
      const dob = new Date(e.dob);
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      return thisYearBirthday >= today && thisYearBirthday <= thirtyDays;
    }).sort((a, b) => {
      const dobA = new Date(a.dob!);
      const dobB = new Date(b.dob!);
      const thisYearA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
      const thisYearB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
      return thisYearA.getTime() - thisYearB.getTime();
    }).slice(0, 5);
  }, [filteredEmployees]);

  const upcomingAnniversaries = useMemo(() => {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    return filteredEmployees.filter(e => {
      if (!e.hireDate) return false;
      const hireDate = new Date(e.hireDate);
      const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());

      if (thisYearAnniversary < today) {
        thisYearAnniversary.setFullYear(today.getFullYear() + 1);
      }

      const yearsOfService = today.getFullYear() - hireDate.getFullYear();
      if (yearsOfService < 1) return false;

      return thisYearAnniversary >= today && thisYearAnniversary <= thirtyDays;
    }).sort((a, b) => {
      const hireA = new Date(a.hireDate);
      const hireB = new Date(b.hireDate);
      const thisYearA = new Date(today.getFullYear(), hireA.getMonth(), hireA.getDate());
      const thisYearB = new Date(today.getFullYear(), hireB.getMonth(), hireB.getDate());
      return thisYearA.getTime() - thisYearB.getTime();
    }).slice(0, 5);
  }, [filteredEmployees]);

  const activeEmployees = filteredEmployees.filter(emp => 'status' in emp && emp.status === 'Active').length;
  const terminatedEmployees = filteredEmployees.filter(emp => 'status' in emp && emp.status === 'Terminated').length;
  const activePercentage = filteredEmployees.length > 0 ? (activeEmployees / filteredEmployees.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-indigo-100">
              Welcome back! Here's your comprehensive workforce overview.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-indigo-200">
              <Activity className="h-4 w-4" />
              <span>Last updated: {format(new Date(), 'MMM dd, yyyy h:mm a')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                showFilters || hasActiveFilters
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              )}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                  {[selectedType !== 'all', selectedStatus !== 'all', selectedRevenue !== 'all', selectedClient !== 'all', selectedVendor !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(), 'MMMM dd, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as EmployeeType | 'all')}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {employeeTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'Active' | 'Terminated' | 'all')}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Revenue</label>
              <select
                value={selectedRevenue}
                onChange={(e) => setSelectedRevenue(e.target.value as 'B' | 'NB' | 'all')}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {revenueOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="h-10 min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor</label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="h-10 min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="all">All Vendors</option>
                {uniqueVendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <X className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active filters:</span>
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Type: {selectedType}
              <button onClick={() => setSelectedType('all')} className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus('all')} className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedRevenue !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              Revenue: {selectedRevenue === 'B' ? 'Billable' : 'Non-Billable'}
              <button onClick={() => setSelectedRevenue('all')} className="rounded-full p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedClient !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Client: {uniqueClients.find((c) => c.id === selectedClient)?.name || selectedClient}
              <button onClick={() => setSelectedClient('all')} className="rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedVendor !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              Vendor: {uniqueVendors.find((v) => v.id === selectedVendor)?.name || selectedVendor}
              <button onClick={() => setSelectedVendor('all')} className="rounded-full p-0.5 hover:bg-pink-200 dark:hover:bg-pink-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards />

      {/* Enhanced Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Type Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Employee Types</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setChartView('pie')}
                className={cn('rounded-lg p-1.5 transition-colors', chartView === 'pie' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' : 'text-slate-400 hover:bg-slate-100')}
              >
                <PieChart className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartView('bar')}
                className={cn('rounded-lg p-1.5 transition-colors', chartView === 'bar' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' : 'text-slate-400 hover:bg-slate-100')}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {chartView === 'pie' ? (
            <div className="flex flex-col items-center">
              <DonutChart data={typeDistribution} colors={['#3b82f6', '#8b5cf6', '#10b981', '#ec489a']} />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {typeDistribution.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ 
                      backgroundColor: item.label === 'W2' ? '#3b82f6' : 
                                     item.label === 'Contract' ? '#8b5cf6' : 
                                     item.label === '1099' ? '#10b981' : '#ec489a'
                    }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <HorizontalBarChart data={typeDistribution} color="#3b82f6" />
          )}
        </div>

        {/* Revenue Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <CircleDollarSign className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Status</h3>
          </div>
          <div className="flex flex-col items-center">
            <DonutChart data={revenueDistribution} />
            <div className="mt-4 w-full space-y-2">
              {revenueDistribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {revenueDistribution.reduce((sum, item) => sum + item.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Workforce Health</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="h-32 w-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(activePercentage / 100) * 351.86} 351.86`}
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(activePercentage)}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-around pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-xl font-bold">{activeEmployees}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                  <UserMinus className="h-4 w-4" />
                  <span className="text-xl font-bold">{terminatedEmployees}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Terminated</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xl font-bold">{filteredEmployees.length}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client & Vendor Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Clients</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stats.uniqueClients} active clients</p>
              </div>
            </div>
            <Eye className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {clientData.length > 0 ? clientData.map((client) => (
              <button
                key={client.clientId || client.name}
                onClick={() => handleClientClick(client.clientId, client.name)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    {client.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {client.employees.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No client data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Vendors</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stats.uniqueVendors} active vendors</p>
              </div>
            </div>
            <Eye className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {vendorData.length > 0 ? vendorData.map((vendor) => (
              <button
                key={vendor.vendorId || vendor.name}
                onClick={() => handleVendorClick(vendor.vendorId, vendor.name)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-purple-200 hover:bg-purple-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
                    {vendor.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{vendor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    {vendor.employees.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No vendor data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      {stateDistribution.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Geographic Distribution</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Employee locations by state</p>
            </div>
          </div>
          <HorizontalBarChart data={stateDistribution} color="#8b5cf6" />
        </div>
      )}

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Recent Hires & Expiring Authorizations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Hires */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Hires</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              Last 30 days
            </span>
          </div>
          {recentHires.length > 0 ? (
            <div className="space-y-3">
              {recentHires.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{employee.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{employee.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{employee.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserPlus className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No recent hires in the last 30 days</p>
            </div>
          )}
        </div>

        {/* Expiring Authorizations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Expiring Soon</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              Next 90 days
            </span>
          </div>
          {upcomingExpirations.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpirations.map((employee) => {
                if (!('expiryDate' in employee) || !employee.expiryDate) return null;
                const daysUntil = Math.ceil(
                  (new Date(employee.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysUntil <= 30;
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full',
                        isUrgent
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      )}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{employee.workAuthorization}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-semibold',
                        isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                      )}>
                        {daysUntil} days left
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(employee.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No expiring authorizations in the next 90 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Birthdays & Anniversaries */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Birthdays */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
                <Cake className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Birthdays</h3>
            </div>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
              Next 30 days
            </span>
          </div>
          {upcomingBirthdays.length > 0 ? (
            <div className="space-y-3">
              {upcomingBirthdays.map((employee) => {
                const dob = new Date(employee.dob!);
                const today = new Date();
                const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1);
                const age = today.getFullYear() - dob.getFullYear();

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-sm font-semibold text-white shadow-lg">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Turning {age + 1}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {format(thisYearBirthday, 'MMM dd')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Cake className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No upcoming birthdays in the next 30 days</p>
            </div>
          )}
        </div>

        {/* Upcoming Anniversaries */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Work Anniversaries</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              Next 30 days
            </span>
          </div>
          {upcomingAnniversaries.length > 0 ? (
            <div className="space-y-3">
              {upcomingAnniversaries.map((employee) => {
                const hireDate = new Date(employee.hireDate);
                const today = new Date();
                const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
                if (thisYearAnniversary < today) thisYearAnniversary.setFullYear(today.getFullYear() + 1);
                const years = today.getFullYear() - hireDate.getFullYear();

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{employee.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{years} {years === 1 ? 'year' : 'years'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {format(thisYearAnniversary, 'MMM dd')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No upcoming anniversaries in the next 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
        
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-2xl font-bold">Ready to grow your team?</h3>
            <p className="mt-2 text-indigo-100 max-w-lg">
              Quickly onboard W2, Contract, 1099, or Offshore employees with our streamlined process and comprehensive management tools.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-200">
              <Users className="h-4 w-4" />
              <span>Manage all employee types in one place</span>
            </div>
          </div>
          <a
            href="/dashboard/employees"
            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl hover:scale-105"
          >
            Manage Employees
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}