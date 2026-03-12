'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronDown, Filter, X } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { useEmployees } from '@/context/EmployeeContext';
import { format } from 'date-fns';
import { EmployeeType } from '@/types/employee';

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

export default function DashboardPage() {
  const { employees, isLoading, stats } = useEmployees();
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Terminated' | 'all'>('all');
  const [selectedRevenue, setSelectedRevenue] = useState<'B' | 'NB' | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter employees by all selected filters
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Type filter
      if (selectedType !== 'all' && emp.type !== selectedType) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        if ('status' in emp && emp.status !== selectedStatus) return false;
      }

      // Revenue filter
      if (selectedRevenue !== 'all') {
        if ('revenueStatus' in emp && emp.revenueStatus !== selectedRevenue) return false;
      }

      // Client filter
      if (selectedClient !== 'all') {
        const empClient = emp.client || ('endClient' in emp ? emp.endClient : '');
        if (empClient !== selectedClient) return false;
      }

      // Vendor filter
      if (selectedVendor !== 'all') {
        if (emp.vendorName !== selectedVendor) return false;
      }

      return true;
    });
  }, [employees, selectedType, selectedStatus, selectedRevenue, selectedClient, selectedVendor]);

  // Check if any filters are active
  const hasActiveFilters = selectedType !== 'all' || selectedStatus !== 'all' || selectedRevenue !== 'all' || selectedClient !== 'all' || selectedVendor !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedRevenue('all');
    setSelectedClient('all');
    setSelectedVendor('all');
  };

  // Get recent hires (last 30 days) - filtered
  const recentHires = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return filteredEmployees
      .filter((emp) => new Date(emp.hireDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
      .slice(0, 5);
  }, [filteredEmployees]);

  // Get upcoming expirations - filtered
  const upcomingExpirations = useMemo(() => {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    return filteredEmployees
      .filter((emp) => {
        if (!emp.expiryDate) return false;
        const expiry = new Date(emp.expiryDate);
        return expiry > now && expiry <= ninetyDaysFromNow;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back! Here&apos;s an overview of your workforce.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                {[selectedType !== 'all', selectedStatus !== 'all', selectedRevenue !== 'all', selectedClient !== 'all', selectedVendor !== 'all'].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), 'MM/dd/yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as EmployeeType | 'all')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {employeeTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'Active' | 'Terminated' | 'all')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Revenue Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue Status</label>
              <select
                value={selectedRevenue}
                onChange={(e) => setSelectedRevenue(e.target.value as 'B' | 'NB' | 'all')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {revenueOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Vendor Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Vendor</label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="all">All Vendors</option>
                {uniqueVendors.map((vendor) => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Active Filters:</span>
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Type: {selectedType}
              <button onClick={() => setSelectedType('all')} className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus('all')} className="ml-1 rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedRevenue !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              Revenue: {selectedRevenue === 'B' ? 'Billable' : 'Non-Billable'}
              <button onClick={() => setSelectedRevenue('all')} className="ml-1 rounded-full p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedClient !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Client: {selectedClient}
              <button onClick={() => setSelectedClient('all')} className="ml-1 rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedVendor !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              Vendor: {selectedVendor}
              <button onClick={() => setSelectedVendor('all')} className="ml-1 rounded-full p-0.5 hover:bg-pink-200 dark:hover:bg-pink-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards />

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Quick Info Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Hires */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Hires
            </h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              Last 30 days
            </span>
          </div>

          {recentHires.length > 0 ? (
            <div className="space-y-3">
              {recentHires.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {employee.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {employee.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {employee.type}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(employee.hireDate), 'MM/dd/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              No recent hires in the last 30 days
            </p>
          )}
        </div>

        {/* Expiring Authorizations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Expiring Authorizations
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              Next 90 days
            </span>
          </div>

          {upcomingExpirations.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpirations.map((employee) => {
                const daysUntil = Math.ceil(
                  (new Date(employee.expiryDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysUntil <= 30;

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          isUrgent
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}
                      >
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {employee.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {employee.workAuthorization}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          isUrgent
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {daysUntil} days left
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
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              No authorizations expiring in the next 90 days
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white dark:border-slate-800">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold">Need to add new employees?</h3>
            <p className="text-sm text-indigo-100">
              Quickly onboard W2, Contract, 1099, or Offshore employees with our streamlined process.
            </p>
          </div>
          <a
            href="/dashboard/employees"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Manage Employees
          </a>
        </div>
      </div>
    </div>
  );
}
