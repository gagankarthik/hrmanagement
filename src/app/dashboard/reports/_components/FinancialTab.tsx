import React, { useMemo } from 'react';
import { UserCheck, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeType } from '@/types/employee';
import { EmptyState } from '@/components/ui/empty-state';
import { DonutChart, CompareBarChart, VIZ, TYPE_COLOR as VIZ_TYPE_COLOR } from '@/components/dashboard/Charts';
import { TabProps, TYPE_COLOR, TYPE_LABEL, isActive, monthlyPay, compactCurrency, fullCurrency } from './shared';
import { ChartCard, ReportCard } from './report-cards';

export function FinancialTab({ filtered, metrics }: TabProps & { metrics: { revenue: number; totalPay: number; billable: number; utilization: number } }) {
  const runRateByType = useMemo(() => {
    const m: Record<EmployeeType, { revenue: number; pay: number; count: number; billableCount: number }> = {
      W2: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      Contract: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      '1099': { revenue: 0, pay: 0, count: 0, billableCount: 0 },
      Offshore: { revenue: 0, pay: 0, count: 0, billableCount: 0 },
    };
    filtered.forEach((e) => {
      if (!isActive(e)) return;
      const pay = monthlyPay(e);
      m[e.type].count += 1;
      m[e.type].pay += pay;
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (isBillable) {
        m[e.type].revenue += pay;
        m[e.type].billableCount += 1;
      }
    });
    return (Object.entries(m) as [EmployeeType, typeof m[EmployeeType]][]).map(([t, v]) => ({ type: t, ...v }));
  }, [filtered]);

  const topEarners = useMemo(() => {
    return filtered
      .filter(isActive)
      .map((e) => ({ employee: e, monthly: monthlyPay(e) }))
      .filter((x) => x.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 10);
  }, [filtered]);

  const maxRevenue = Math.max(...runRateByType.map((r) => r.revenue), 1);

  // ── Interactive chart data (reuses runRateByType) ──
  const billableBars = useMemo(
    () => runRateByType.map((r) => ({
      type: TYPE_LABEL[r.type],
      Billable: r.billableCount,
      'Non-billable': Math.max(r.count - r.billableCount, 0),
    })),
    [runRateByType]
  );

  const runRatePie = useMemo(
    () => runRateByType
      .filter((r) => r.revenue > 0)
      .map((r) => ({ name: TYPE_LABEL[r.type], value: Math.round(r.revenue), color: VIZ_TYPE_COLOR[r.type] || VIZ.slate })),
    [runRateByType]
  );

  return (
    <div className="space-y-6">
      {/* Interactive visuals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Billable vs Non-billable" subtitle="Active headcount by class" icon={UserCheck} delay={40}>
          <CompareBarChart
            data={billableBars}
            xKey="type"
            bars={[
              { key: 'Billable', name: 'Billable', color: VIZ.emerald },
              { key: 'Non-billable', name: 'Non-billable', color: VIZ.slate },
            ]}
          />
        </ChartCard>
        <ChartCard title="Run-Rate Mix" subtitle="Monthly billable revenue share by class" icon={DollarSign} delay={120}>
          {runRatePie.length ? (
            <DonutChart data={runRatePie} />
          ) : (
            <EmptyState title="No billable revenue" description="No billable employees with pay data in scope." />
          )}
        </ChartCard>
      </div>

      <ReportCard title="Monthly Run-Rate by Class" subtitle="Billable revenue contribution per employee class" icon={DollarSign}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 pr-4">Class</th>
              <th className="py-3 pr-4">Active</th>
              <th className="py-3 pr-4">Billable</th>
              <th className="py-3 pr-4">Avg pay/mo</th>
              <th className="py-3 pr-4">Monthly run-rate</th>
              <th className="py-3">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {runRateByType.map((r) => {
              const avg = r.billableCount ? r.revenue / r.billableCount : 0;
              const w = (r.revenue / maxRevenue) * 100;
              return (
                <tr key={r.type} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', TYPE_COLOR[r.type].bg, TYPE_COLOR[r.type].text, TYPE_COLOR[r.type].ring)}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[r.type].hex }} />
                      {TYPE_LABEL[r.type]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-900">{r.count}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-700">{r.billableCount}</td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">{avg > 0 ? compactCurrency(avg) : '—'}</td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-emerald-700">{compactCurrency(r.revenue)}</td>
                  <td className="py-3 min-w-[140px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: TYPE_COLOR[r.type].hex }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-xs font-bold text-slate-700">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4 tabular-nums">{runRateByType.reduce((s, r) => s + r.count, 0)}</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{metrics.billable}</td>
              <td className="py-3 pr-4 text-slate-500">{metrics.utilization}% util</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{compactCurrency(metrics.revenue)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      <ReportCard title="Top 10 Earners" subtitle="Highest monthly pay across active employees" icon={TrendingUp}>
        {topEarners.length === 0 ? (
          <EmptyState title="No pay data" description="No employees with pay information in the filtered set." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Rank</th>
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Position</th>
                  <th className="py-2.5 pr-4">Type</th>
                  <th className="py-2.5">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {topEarners.map((row, i) => {
                  const e = row.employee;
                  const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
                  const revenueStatus = 'revenueStatus' in e ? (e as { revenueStatus?: string }).revenueStatus : undefined;
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{e.position || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {salaryType || '—'} · {revenueStatus === 'B' ? 'Billable' : revenueStatus === 'NB' ? 'Non-billable' : '—'}
                      </td>
                      <td className="py-2.5 font-bold tabular-nums text-emerald-700">{fullCurrency(row.monthly)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ReportCard>
    </div>
  );
}
