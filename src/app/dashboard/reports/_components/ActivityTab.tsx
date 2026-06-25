import React, { useMemo } from 'react';
import { UserCheck, UserX } from 'lucide-react';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { TabProps, TYPE_COLOR, TYPE_LABEL } from './shared';
import { SummaryStat, ReportCard } from './report-cards';

export function ActivityTab({ filtered }: TabProps) {
  const recentHires = useMemo(() => {
    const now = new Date();
    const last90 = new Date(now.getTime() - 90 * 86400000);
    return filtered
      .filter((e) => {
        if (!e.hireDate) return false;
        const h = new Date(e.hireDate);
        return !Number.isNaN(h.getTime()) && h >= last90 && h <= now;
      })
      .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());
  }, [filtered]);

  const recentTerminations = useMemo(() => {
    const now = new Date();
    const last90 = new Date(now.getTime() - 90 * 86400000);
    return filtered
      .filter((e) => {
        if (!('status' in e) || (e as { status: string }).status !== 'Terminated') return false;
        if (!e.dor) return false;
        const d = new Date(e.dor);
        return !Number.isNaN(d.getTime()) && d >= last90 && d <= now;
      })
      .sort((a, b) => new Date(b.dor!).getTime() - new Date(a.dor!).getTime());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat icon={UserCheck} label="Hires (90d)" value={recentHires.length.toString()} sub="last 90 days" tone="emerald" />
        <SummaryStat icon={UserX} label="Terminations (90d)" value={recentTerminations.length.toString()} sub="last 90 days" tone="red" />
      </div>

      <ReportCard title="Recent Hires" subtitle="Last 90 days, most recent first" icon={UserCheck}>
        {recentHires.length === 0 ? (
          <EmptyState title="No recent hires" description="No new hires in the last 90 days." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Position</th>
                  <th className="py-2.5 pr-4">Location</th>
                  <th className="py-2.5">Hired</th>
                </tr>
              </thead>
              <tbody>
                {recentHires.slice(0, 25).map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                        {TYPE_LABEL[e.type]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{e.position || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">{[e.city, e.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-slate-900">{format(new Date(e.hireDate), 'MMM d, yyyy')}</p>
                      <p className="text-[11px] text-slate-400">{differenceInDays(new Date(), new Date(e.hireDate))}d ago</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentHires.length > 25 && <p className="mt-3 text-xs text-slate-500">Showing 25 of {recentHires.length}. Export for the full list.</p>}
          </div>
        )}
      </ReportCard>

      {recentTerminations.length > 0 && (
        <ReportCard title="Recent Terminations" subtitle="Last 90 days, most recent first" icon={UserX}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Tenure</th>
                  <th className="py-2.5">Released</th>
                </tr>
              </thead>
              <tbody>
                {recentTerminations.slice(0, 25).map((e) => {
                  const tenure = e.hireDate && e.dor ? differenceInYears(new Date(e.dor), new Date(e.hireDate)) : null;
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{e.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{tenure !== null ? `${tenure}y` : '—'}</td>
                      <td className="py-2.5 font-medium text-slate-900">{format(new Date(e.dor!), 'MMM d, yyyy')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  );
}
