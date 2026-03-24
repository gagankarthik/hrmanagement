'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';

export default function AnalyticsCharts() {
  const { employees, stats } = useEmployees();

  // Calculate distribution by state
  const stateDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach((emp) => {
      const state = emp.state || 'Unknown';
      distribution[state] = (distribution[state] || 0) + 1;
    });

    // Sort by count and take top 8
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [employees]);

  // Calculate work authorization distribution (excluding Offshore employees)
  const authDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.type !== 'Offshore' && 'workAuthorization' in emp) {
        const auth = emp.workAuthorization || 'Not Specified';
        distribution[auth] = (distribution[auth] || 0) + 1;
      }
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  // Calculate client distribution
  const clientDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach((emp) => {
      const client = emp.client || 'No Client';
      if (client) {
        distribution[client] = (distribution[client] || 0) + 1;
      }
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  // Calculate vendor distribution
  const vendorDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach((emp) => {
      const vendor = emp.vendorName || 'No Vendor';
      distribution[vendor] = (distribution[vendor] || 0) + 1;
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  const maxState = stateDistribution.length > 0 ? stateDistribution[0][1] : 1;
  const maxHiring = stats.hiringTrendByMonth.length > 0
    ? Math.max(...stats.hiringTrendByMonth.map((h) => h.count)) || 1
    : 1;

  // Colors for pie chart segments
  const typeColors = {
    W2: { color: 'bg-blue-500', light: 'bg-blue-100' },
    Contract: { color: 'bg-purple-500', light: 'bg-purple-100' },
    '1099': { color: 'bg-teal-500', light: 'bg-teal-100' },
    Offshore: { color: 'bg-pink-500', light: 'bg-pink-100' },
  };

  // Calculate percentages for donut chart (handle division by zero)
  const total = stats.totalEmployees || 1;
  const typePercentages = [
    { type: 'W2', count: stats.w2Count, percentage: (stats.w2Count / total) * 100 },
    { type: 'Contract', count: stats.contractCount, percentage: (stats.contractCount / total) * 100 },
    { type: '1099', count: stats.employee1099Count, percentage: (stats.employee1099Count / total) * 100 },
    { type: 'Offshore', count: stats.offshoreCount, percentage: (stats.offshoreCount / total) * 100 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Employee Distribution by Type - Donut Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Employee Distribution by Type
        </h3>

        <div className="flex items-center gap-8">
          {/* Donut Chart */}
          <div className="relative h-40 w-40 flex-shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Segments */}
              {typePercentages.reduce<{ offset: number; elements: React.ReactNode[] }>(
                (acc, item, idx) => {
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = (item.percentage / 100) * circumference;
                  const strokeDashoffset = -acc.offset;

                  const colors = ['text-blue-500', 'text-purple-500', 'text-teal-500', 'text-pink-500'];

                  acc.elements.push(
                    <circle
                      key={item.type}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeDasharray={`${strokeDasharray} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      className={colors[idx]}
                    />
                  );

                  acc.offset += strokeDasharray;
                  return acc;
                },
                { offset: 0, elements: [] }
              ).elements}
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalEmployees}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {typePercentages.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      typeColors[item.type as keyof typeof typeColors].color
                    )}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Status Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Revenue Status (B/NB)
        </h3>

        <div className="flex items-center gap-8">
          {/* Donut Chart for Revenue */}
          <div className="relative h-40 w-40 flex-shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                className="text-slate-100 dark:text-slate-800"
              />
              {(() => {
                const revenueTotal = (stats.billableCount + stats.nonBillableCount) || 1;
                const billablePercent = (stats.billableCount / revenueTotal) * 100;
                const circumference = 2 * Math.PI * 40;
                const billableDash = (billablePercent / 100) * circumference;

                return (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeDasharray={`${billableDash} ${circumference}`}
                      className="text-emerald-500"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeDasharray={`${circumference - billableDash} ${circumference}`}
                      strokeDashoffset={-billableDash}
                      className="text-orange-500"
                    />
                  </>
                );
              })()}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.billableCount + stats.nonBillableCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Billable (B)</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {stats.billableCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Non-Billable (NB)</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {stats.nonBillableCount}
              </span>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Subcontractors (Active)</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats.activeSubcontractors}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Subcontractors (Inactive)</span>
                <span className="text-sm font-semibold text-slate-500">
                  {stats.inactiveSubcontractors}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Trend - Bar Chart with W2 and Offshore */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Hiring Trend (Last 12 Months)
        </h3>

        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-indigo-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">W2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-pink-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Offshore</span>
          </div>
        </div>

        <div className="flex h-48 items-end gap-2">
          {stats.hiringTrendByMonth.map((item) => (
            <div
              key={item.month}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-slate-900 dark:text-white">
                {item.count}
              </span>
              <div className="flex w-full gap-0.5">
                {/* W2 bar */}
                <div
                  className="flex-1 rounded-t-lg bg-blue-500 transition-all duration-300"
                  style={{
                    height: `${(item.w2 / maxHiring) * 100}%`,
                    minHeight: item.w2 > 0 ? '8px' : '0px',
                  }}
                />
                {/* Offshore bar */}
                <div
                  className="flex-1 rounded-t-lg bg-pink-500 transition-all duration-300"
                  style={{
                    height: `${(item.offshore / maxHiring) * 100}%`,
                    minHeight: item.offshore > 0 ? '8px' : '0px',
                  }}
                />
                {/* Others bar */}
                <div
                  className="flex-1 rounded-t-lg bg-indigo-400 transition-all duration-300"
                  style={{
                    height: `${((item.count - item.w2 - item.offshore) / maxHiring) * 100}%`,
                    minHeight: (item.count - item.w2 - item.offshore) > 0 ? '8px' : '0px',
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.month.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Top Clients
          </h3>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {stats.uniqueClients} unique
          </span>
        </div>

        <div className="space-y-3">
          {clientDistribution.length > 0 ? clientDistribution.map(([client, count]) => (
            <div key={client} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{client}</span>
                <span className="font-medium text-slate-900 dark:text-white">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                  style={{ width: `${(count / (clientDistribution[0]?.[1] || 1)) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No client data available</p>
          )}
        </div>
      </div>

      {/* Vendor Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Top Vendors
          </h3>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {stats.uniqueVendors} unique
          </span>
        </div>

        <div className="space-y-3">
          {vendorDistribution.length > 0 ? vendorDistribution.map(([vendor, count]) => (
            <div key={vendor} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{vendor}</span>
                <span className="font-medium text-slate-900 dark:text-white">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${(count / (vendorDistribution[0]?.[1] || 1)) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No vendor data available</p>
          )}
        </div>
      </div>

      {/* State Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Distribution by State
        </h3>

        <div className="space-y-3">
          {stateDistribution.map(([state, count]) => (
            <div key={state} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{state}</span>
                <span className="font-medium text-slate-900 dark:text-white">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${(count / maxState) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Authorization Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Work Authorization Types
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {authDistribution.map(([auth, count], idx) => {
            const colors = [
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
              'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
              'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
            ];

            return (
              <div
                key={auth}
                className={cn(
                  'rounded-xl p-4',
                  colors[idx % colors.length]
                )}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="mt-1 text-sm font-medium opacity-80">{auth}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active vs Terminated */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          Employment Status Overview
        </h3>

        <div className="flex items-center gap-8">
          {/* Progress Bar */}
          {(() => {
            const statusTotal = (stats.activeCount + stats.terminatedCount) || 1;
            const activePercent = (stats.activeCount / statusTotal) * 100;
            const terminatedPercent = (stats.terminatedCount / statusTotal) * 100;
            return (
              <>
                <div className="flex-1">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Active Employees</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {stats.activeCount} ({activePercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${activePercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Terminated</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {stats.terminatedCount} ({terminatedPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                      style={{ width: `${terminatedPercent}%` }}
                    />
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Expiring Authorizations Warning */}
        {stats.expiringAuthorizations > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {stats.expiringAuthorizations} Work Authorization(s) Expiring Soon
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                These employees have authorizations expiring within the next 30 days
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
