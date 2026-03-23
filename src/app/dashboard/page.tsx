'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ChevronDown,
  Filter,
  X,
  Users,
  TrendingUp,
  Building2,
  Truck,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { useEmployees } from '@/context/EmployeeContext';
import { format } from 'date-fns';
import { EmployeeType, Employee } from '@/types/employee';
import { cn } from '@/lib/utils';

const employeeTypes: { value: EmployeeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'W2', label: 'W2' },
  { value: 'Contract', label: 'Contract' },
  { value: '1099', label: '1099' },
  { value: 'Offshore', label: 'Offshore' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Terminated', label: 'Terminated' },
];

const revenueOptions = [
  { value: 'all', label: 'All Revenue' },
  { value: 'B', label: 'Billable (B)' },
  { value: 'NB', label: 'Non-Billable (NB)' },
];

// Employee List Modal Component
function EmployeeListModal({
  isOpen,
  onClose,
  title,
  employees,
  type
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  employees: Employee[];
  type: 'client' | 'vendor';
}) {
  if (!isOpen) return null;

  const typeColors = {
    W2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    '1099': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    Offshore: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  };

  const statusColors = {
    Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-3">
              {type === 'client' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
                  <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {employees.length} employee{employees.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {employees.length > 0 ? (
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-semibold text-white shadow-lg">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {employee.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {employee.position}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', typeColors[employee.type])}>
                            {employee.type}
                          </span>
                          {'status' in employee && (
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[employee.status])}>
                              {employee.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Hired: {format(new Date(employee.hireDate), 'MM/dd/yyyy')}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {employee.state}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-slate-500 dark:text-slate-400">No employees found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { employees, isLoading, stats } = useEmployees();
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [selectedRevenue, setSelectedRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state for client/vendor employee list
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalEmployees, setModalEmployees] = useState<Employee[]>([]);
  const [modalType, setModalType] = useState<'client' | 'vendor'>('client');

  // Get unique clients and vendors for dropdowns
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    employees.forEach((emp) => {
      if (emp.client) clients.add(emp.client);
      if ('endClient' in emp && emp.endClient) clients.add(emp.endClient);
    });
    return Array.from(clients).sort();
  }, [employees]);

  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    employees.forEach((emp) => {
      if (emp.vendorName) vendors.add(emp.vendorName);
    });
    return Array.from(vendors).sort();
  }, [employees]);

  // Client distribution with employee data
  const clientData = useMemo(() => {
    const distribution: Record<string, Employee[]> = {};
    employees.forEach((emp) => {
      const client = emp.client || ('endClient' in emp ? emp.endClient : '');
      if (client) {
        if (!distribution[client]) distribution[client] = [];
        distribution[client].push(emp);
      }
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6);
  }, [employees]);

  // Vendor distribution with employee data
  const vendorData = useMemo(() => {
    const distribution: Record<string, Employee[]> = {};
    employees.forEach((emp) => {
      if (emp.vendorName) {
        if (!distribution[emp.vendorName]) distribution[emp.vendorName] = [];
        distribution[emp.vendorName].push(emp);
      }
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6);
  }, [employees]);

  // Filter employees by all selected filters
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
        const empClient = emp.client || ('endClient' in emp ? emp.endClient : '');
        if (empClient !== selectedClient) return false;
      }
      if (selectedVendor !== 'all') {
        if (emp.vendorName !== selectedVendor) return false;
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

  // Handle client click
  const handleClientClick = (clientName: string, clientEmployees: Employee[]) => {
    setModalTitle(`Client: ${clientName}`);
    setModalEmployees(clientEmployees);
    setModalType('client');
    setModalOpen(true);
  };

  // Handle vendor click
  const handleVendorClick = (vendorName: string, vendorEmployees: Employee[]) => {
    setModalTitle(`Vendor: ${vendorName}`);
    setModalEmployees(vendorEmployees);
    setModalType('vendor');
    setModalOpen(true);
  };

  // Get recent hires (last 30 days)
  const recentHires = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return filteredEmployees
      .filter((emp) => new Date(emp.hireDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
      .slice(0, 5);
  }, [filteredEmployees]);

  // Get upcoming expirations - Exclude Offshore employees
  const upcomingExpirations = useMemo(() => {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    return filteredEmployees
      .filter((emp) => {
        // Exclude Offshore employees from expiry tracking
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
      {/* Employee List Modal */}
      <EmployeeListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        employees={modalEmployees}
        type={modalType}
      />

      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-indigo-100">
              Welcome back! Here&apos;s your workforce overview.
            </p>
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
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(), 'MM/dd/yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</label>
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
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>{client}</option>
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
                {uniqueVendors.map((vendor) => (
                  <option key={vendor} value={vendor}>{vendor}</option>
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Filters:</span>
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {selectedType}
              <button onClick={() => setSelectedType('all')} className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {selectedStatus}
              <button onClick={() => setSelectedStatus('all')} className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedRevenue !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              {selectedRevenue === 'B' ? 'Billable' : 'Non-Billable'}
              <button onClick={() => setSelectedRevenue('all')} className="rounded-full p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedClient !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {selectedClient}
              <button onClick={() => setSelectedClient('all')} className="rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedVendor !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              {selectedVendor}
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

      {/* Client & Vendor Cards - Clickable */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients - Clickable */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Clients</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stats.uniqueClients} unique clients</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {clientData.length > 0 ? clientData.map(([client, emps]) => (
              <button
                key={client}
                onClick={() => handleClientClick(client, emps)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    {client.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{client}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {emps.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </button>
            )) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No client data available</p>
            )}
          </div>
        </div>

        {/* Top Vendors - Clickable */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Vendors</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stats.uniqueVendors} unique vendors</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {vendorData.length > 0 ? vendorData.map(([vendor, emps]) => (
              <button
                key={vendor}
                onClick={() => handleVendorClick(vendor, emps)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-purple-200 hover:bg-purple-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
                    {vendor.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{vendor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    {emps.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
                </div>
              </button>
            )) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No vendor data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Recent Hires & Expiring Authorizations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Hires */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
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
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
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
                      {format(new Date(employee.hireDate), 'MM/dd/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No recent hires</p>
            </div>
          )}
        </div>

        {/* Expiring Authorizations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
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
                const daysUntil = Math.ceil(
                  (new Date(employee.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysUntil <= 30;

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold',
                        isUrgent
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      )}>
                        <Clock className="h-5 w-5" />
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
                        {daysUntil} days
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(employee.expiryDate), 'MM/dd/yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No expiring authorizations</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10"></div>

        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold">Ready to grow your team?</h3>
            <p className="mt-2 text-indigo-100">
              Quickly onboard W2, Contract, 1099, or Offshore employees with our streamlined process.
            </p>
          </div>
          <a
            href="/dashboard/employees"
            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
          >
            Manage Employees
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
