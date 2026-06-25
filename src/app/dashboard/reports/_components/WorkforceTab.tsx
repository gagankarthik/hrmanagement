import React, { useMemo } from 'react';
import { Users, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeType } from '@/types/employee';
import { EmptyState } from '@/components/ui/empty-state';
import { DonutChart, CompareBarChart, VIZ, TYPE_COLOR as VIZ_TYPE_COLOR } from '@/components/dashboard/Charts';
import { TabProps, TYPE_COLOR, TYPE_LABEL, isActive } from './shared';
import { ChartCard, ReportCard } from './report-cards';

export function WorkforceTab({ filtered }: TabProps) {
  const typeDist = useMemo(() => {
    const m: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
    filtered.forEach((e) => m[e.type] += 1);
    return (Object.entries(m) as [EmployeeType, number][]).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const stateDist = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((e) => { if (e.state) m[e.state] = (m[e.state] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const statusByType = useMemo(() => {
    const m: Record<EmployeeType, { active: number; terminated: number }> = {
      W2: { active: 0, terminated: 0 }, Contract: { active: 0, terminated: 0 },
      '1099': { active: 0, terminated: 0 }, Offshore: { active: 0, terminated: 0 },
    };
    filtered.forEach((e) => {
      const s = 'status' in e ? (e as { status: string }).status : 'Active';
      if (s === 'Active') m[e.type].active += 1; else m[e.type].terminated += 1;
    });
    return m;
  }, [filtered]);

  // ── Interactive chart data (reuses the arrays above) ──
  const classPie = useMemo(
    () => typeDist
      .filter((t) => t.value > 0)
      .map((t) => ({ name: TYPE_LABEL[t.label], value: t.value, color: VIZ_TYPE_COLOR[t.label] || VIZ.slate })),
    [typeDist]
  );

  const statusByTypeBars = useMemo(
    () => (Object.keys(statusByType) as EmployeeType[]).map((t) => ({
      type: TYPE_LABEL[t],
      Active: statusByType[t].active,
      Terminated: statusByType[t].terminated,
    })),
    [statusByType]
  );

  return (
    <div className="space-y-6">
      {/* Interactive visuals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Workforce Composition" subtitle="Headcount share by employment class" icon={Users} delay={40}>
          {classPie.length ? (
            <DonutChart data={classPie} />
          ) : (
            <EmptyState title="No employees match" description="Adjust filters to see the composition." />
          )}
        </ChartCard>
        <ChartCard title="Active vs Terminated" subtitle="Status breakdown by class" icon={Activity} delay={120}>
          <CompareBarChart
            data={statusByTypeBars}
            xKey="type"
            bars={[
              { key: 'Active', name: 'Active', color: VIZ.emerald },
              { key: 'Terminated', name: 'Terminated', color: VIZ.rose },
            ]}
          />
        </ChartCard>
      </div>

      <ReportCard title="Headcount by Class" subtitle="Class distribution + status breakdown" icon={Users}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 pr-4">Class</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Active</th>
              <th className="py-3 pr-4">Terminated</th>
              <th className="py-3 pr-4">Share</th>
              <th className="py-3">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {typeDist.map((t) => {
              const total = t.value;
              const a = statusByType[t.label].active;
              const x = statusByType[t.label].terminated;
              const share = filtered.length ? (total / filtered.length) * 100 : 0;
              return (
                <tr key={t.label} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', TYPE_COLOR[t.label].bg, TYPE_COLOR[t.label].text, TYPE_COLOR[t.label].ring)}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t.label].hex }} />
                      {TYPE_LABEL[t.label]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-slate-900">{total}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-700">{a}</td>
                  <td className="py-3 pr-4 tabular-nums text-red-600">{x}</td>
                  <td className="py-3 pr-4 tabular-nums text-slate-600">{share.toFixed(1)}%</td>
                  <td className="py-3 min-w-[120px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: TYPE_COLOR[t.label].hex }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-xs font-bold text-slate-700">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4 tabular-nums">{filtered.length}</td>
              <td className="py-3 pr-4 tabular-nums text-emerald-700">{filtered.filter(isActive).length}</td>
              <td className="py-3 pr-4 tabular-nums text-red-600">{filtered.length - filtered.filter(isActive).length}</td>
              <td className="py-3 pr-4 tabular-nums">100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      <ReportCard title="Top States" subtitle="Where your workforce is concentrated" icon={MapPin}>
        {stateDist.length === 0 ? (
          <EmptyState title="No state data" description="No employees with state information in the filtered set." />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Rank</th>
                <th className="py-2.5 pr-4">State</th>
                <th className="py-2.5 pr-4">Employees</th>
                <th className="py-2.5">Share</th>
              </tr>
            </thead>
            <tbody>
              {stateDist.map((s, i) => {
                const share = filtered.length ? (s.value / filtered.length) * 100 : 0;
                return (
                  <tr key={s.label} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{s.label}</td>
                    <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{s.value}</td>
                    <td className="py-2.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportCard>
    </div>
  );
}
