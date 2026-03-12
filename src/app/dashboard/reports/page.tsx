'use client';

import React, { useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Users,
  TrendingUp,
  MapPin,
  Briefcase,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { employees, stats, isLoading } = useEmployees();

  // Calculate various report metrics
  const reportData = useMemo(() => {
    // State distribution
    const stateDistribution: Record<string, number> = {};
    employees.forEach((emp) => {
      const state = emp.state || 'Unknown';
      stateDistribution[state] = (stateDistribution[state] || 0) + 1;
    });

    // Work authorization distribution
    const authDistribution: Record<string, number> = {};
    employees.forEach((emp) => {
      const auth = emp.workAuthorization || 'Not Specified';
      authDistribution[auth] = (authDistribution[auth] || 0) + 1;
    });

    // Position distribution
    const positionDistribution: Record<string, number> = {};
    employees.forEach((emp) => {
      positionDistribution[emp.position] = (positionDistribution[emp.position] || 0) + 1;
    });

    // Monthly hires this year
    const currentYear = new Date().getFullYear();
    const monthlyHires: Record<string, number> = {};
    employees.forEach((emp) => {
      const hireDate = new Date(emp.hireDate);
      if (hireDate.getFullYear() === currentYear) {
        const month = format(hireDate, 'MMM');
        monthlyHires[month] = (monthlyHires[month] || 0) + 1;
      }
    });

    // Expiring authorizations in next 90 days
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const expiringAuth = employees.filter((emp) => {
      if (!emp.expiryDate) return false;
      const expiry = new Date(emp.expiryDate);
      return expiry > now && expiry <= ninetyDaysFromNow;
    });

    return {
      stateDistribution: Object.entries(stateDistribution).sort((a, b) => b[1] - a[1]),
      authDistribution: Object.entries(authDistribution).sort((a, b) => b[1] - a[1]),
      positionDistribution: Object.entries(positionDistribution).sort((a, b) => b[1] - a[1]).slice(0, 10),
      monthlyHires,
      expiringAuth,
    };
  }, [employees]);

  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEmployeeReport = () => {
    const data = employees.map((emp) => ({
      Name: emp.name,
      Type: emp.type,
      Position: emp.position,
      State: emp.state,
      'Hire Date': emp.hireDate,
      'Work Authorization': emp.workAuthorization,
      'Expiry Date': emp.expiryDate || 'N/A',
      Email: emp.personalEmail,
      Status: 'status' in emp ? emp.status : 'N/A',
    }));
    downloadCSV(data, 'employee_report');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <FileBarChart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View analytics and export employee data
            </p>
          </div>
        </div>

        <button
          onClick={exportEmployeeReport}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Download className="h-4 w-4" />
          Export All Employees
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">States</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {reportData.stateDistribution.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {reportData.expiringAuth.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employee Type Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Employee Types
          </h3>
          <div className="space-y-4">
            {[
              { label: 'W2 Employees', count: stats.w2Count, color: 'bg-blue-500' },
              { label: 'Contract', count: stats.contractCount, color: 'bg-purple-500' },
              { label: '1099', count: stats.employee1099Count, color: 'bg-teal-500' },
              { label: 'Offshore', count: stats.offshoreCount, color: 'bg-pink-500' },
            ].map((item) => {
              const percentage = stats.totalEmployees > 0
                ? (item.count / stats.totalEmployees) * 100
                : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className={cn('h-full rounded-full transition-all', item.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top States */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Top States
          </h3>
          <div className="space-y-3">
            {reportData.stateDistribution.slice(0, 6).map(([state, count], idx) => {
              const maxCount = reportData.stateDistribution[0]?.[1] || 1;
              const percentage = (count / maxCount) * 100;
              return (
                <div key={state} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-medium text-slate-400">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{state}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Authorization */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Work Authorization
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {reportData.authDistribution.slice(0, 6).map(([auth, count]) => (
              <div
                key={auth}
                className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
              >
                <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{auth}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Positions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Top Positions
          </h3>
          <div className="space-y-2">
            {reportData.positionDistribution.slice(0, 6).map(([position, count]) => (
              <div
                key={position}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-900"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">{position}</span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Authorizations Alert */}
      {reportData.expiringAuth.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
              Work Authorizations Expiring in 90 Days
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 dark:border-amber-800">
                  <th className="pb-2 text-left font-medium text-amber-800 dark:text-amber-200">Name</th>
                  <th className="pb-2 text-left font-medium text-amber-800 dark:text-amber-200">Type</th>
                  <th className="pb-2 text-left font-medium text-amber-800 dark:text-amber-200">Authorization</th>
                  <th className="pb-2 text-left font-medium text-amber-800 dark:text-amber-200">Expiry Date</th>
                  <th className="pb-2 text-left font-medium text-amber-800 dark:text-amber-200">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200 dark:divide-amber-800">
                {reportData.expiringAuth.map((emp) => {
                  const daysLeft = Math.ceil(
                    (new Date(emp.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={emp.id}>
                      <td className="py-2 text-amber-900 dark:text-amber-100">{emp.name}</td>
                      <td className="py-2 text-amber-700 dark:text-amber-300">{emp.type}</td>
                      <td className="py-2 text-amber-700 dark:text-amber-300">{emp.workAuthorization}</td>
                      <td className="py-2 text-amber-700 dark:text-amber-300">
                        {format(new Date(emp.expiryDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-2">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          daysLeft <= 30
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        )}>
                          {daysLeft} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
