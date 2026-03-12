'use client';

import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, ChevronDown, Filter } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { useEmployees } from '@/context/EmployeeContext';
import { format } from 'date-fns';
import { EmployeeType } from '@/types/employee';

const employeeTypes: { value: EmployeeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'W2', label: 'W2 Employees' },
  { value: 'Contract', label: 'Contract' },
  { value: '1099', label: '1099' },
  { value: 'Offshore', label: 'Offshore' },
];

export default function DashboardPage() {
  const { employees, isLoading, stats } = useEmployees();
  const [selectedType, setSelectedType] = useState<EmployeeType | 'all'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter employees by selected type
  const filteredEmployees = React.useMemo(() => {
    if (selectedType === 'all') return employees;
    return employees.filter((emp) => emp.type === selectedType);
  }, [employees, selectedType]);

  // Get recent hires (last 30 days) - filtered by selected type
  const recentHires = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return filteredEmployees
      .filter((emp) => new Date(emp.hireDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
      .slice(0, 5);
  }, [filteredEmployees]);

  // Get upcoming expirations - filtered by selected type
  const upcomingExpirations = React.useMemo(() => {
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
          {/* Employee Type Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Filter className="h-4 w-4" />
              <span>{employeeTypes.find((t) => t.value === selectedType)?.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {employeeTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedType(type.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                        selectedType === type.value
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type.label}
                      {selectedType === type.value && (
                        <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Filter indicator */}
      {selectedType !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Showing:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            {employeeTypes.find((t) => t.value === selectedType)?.label}
            <button
              onClick={() => setSelectedType('all')}
              className="ml-1 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
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
                      {format(new Date(employee.hireDate), 'MMM d, yyyy')}
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
                        {format(new Date(employee.expiryDate), 'MMM d, yyyy')}
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
