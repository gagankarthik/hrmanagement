import React from 'react';
import Link from 'next/link';
import { Search, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { LeaveType } from '@/types/leave';
import { typeBadge } from './shared';

export interface BalanceRow {
  emp: { id: string; name: string; type: import('@/types/employee').EmployeeType };
  allowance: number;
  used: number;
  remaining: number;
  byType: Partial<Record<LeaveType, number>>;
}

export function BalancesPanel({
  rows,
  searchQuery,
  onSearch,
}: {
  rows: BalanceRow[];
  searchQuery: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="surface">
      {/* Toolbar — reuse the employee search */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Scale}
            tone="brand"
            title={searchQuery ? 'No employees match your search' : 'No employees yet'}
            description={searchQuery ? 'Try a different name.' : 'Add employees to see their leave balances.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee', 'Type', 'Allowance', 'Used', 'Remaining', 'Utilization', 'Breakdown'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, allowance, used, remaining, byType }) => {
                const ratio = allowance > 0 ? used / allowance : 0;
                const pct = Math.min(100, Math.round(ratio * 100));
                const barColor =
                  ratio > 1
                    ? 'bg-red-500'
                    : ratio >= 0.8
                    ? 'bg-amber-500'
                    : 'bg-brand-500';
                const breakdown = (Object.entries(byType) as [LeaveType, number][])
                  .filter(([, d]) => d > 0)
                  .sort((a, b) => b[1] - a[1]);
                return (
                  <tr key={emp.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                          {emp.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{emp.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {emp.type}
                      </span>
                    </td>
                    {allowance === 0 ? (
                      <td className="px-5 py-3.5" colSpan={4}>
                        <span className="text-sm text-slate-400">
                          No policy ·{' '}
                          <Link
                            href="/policies"
                            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            Set allowance
                          </Link>
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{allowance}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{used}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                              remaining === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                            )}
                          >
                            {remaining} left
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] font-medium tabular-nums text-slate-400">{used}/{allowance}</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-5 py-3.5">
                      {breakdown.length === 0 ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {breakdown.map(([t, d]) => (
                            <span
                              key={t}
                              className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', typeBadge[t])}
                            >
                              {t} · {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          {rows.length} employee{rows.length !== 1 ? 's' : ''} · Used = sum of approved leave days
        </p>
      </div>
    </div>
  );
}
