import React, { useMemo } from 'react';
import { Shield, FileText, Heart, Wallet, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { TabProps, TYPE_COLOR, TYPE_LABEL, isActive } from './shared';
import { ReportCard } from './report-cards';

export function ComplianceTab({ filtered, metrics }: TabProps & { metrics: { expired: number; b30: number; b60: number; b90: number; w2Count: number; withMedical: number; with401k: number } }) {
  const expiring = useMemo(() => {
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 86400000);
    return filtered.filter((e) => {
      if (!isActive(e)) return false;
      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!expiry) return false;
      const d = new Date(expiry);
      return !Number.isNaN(d.getTime()) && d <= in90;
    }).sort((a, b) => {
      const da = new Date((a as { expiryDate?: string }).expiryDate!).getTime();
      const db = new Date((b as { expiryDate?: string }).expiryDate!).getTime();
      return da - db;
    });
  }, [filtered]);

  const authMix = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((e) => {
      const wa = 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined;
      if (wa) m[wa] = (m[wa] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportCard title="Authorization Expiry Pipeline" subtitle={`${expiring.length} active employee${expiring.length === 1 ? '' : 's'} with authorizations expiring in the next 90 days (or already expired)`} icon={Shield}>
        {expiring.length === 0 ? (
          <EmptyState title="All clear" description="No upcoming or expired work authorizations in the current scope." tone="emerald" icon={CheckCircle2} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">Employee</th>
                  <th className="py-2.5 pr-4">Class</th>
                  <th className="py-2.5 pr-4">Authorization</th>
                  <th className="py-2.5 pr-4">Expiry</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">State</th>
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 20).map((e) => {
                  const expiry = (e as { expiryDate?: string }).expiryDate;
                  const wa = (e as { workAuthorization?: string }).workAuthorization;
                  const now = new Date();
                  const exp = new Date(expiry!);
                  const days = differenceInDays(exp, now);
                  const tone = days < 0 ? 'red' : days <= 30 ? 'amber' : days <= 60 ? 'yellow' : 'sky';
                  const toneColor = tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200'
                    : tone === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : tone === 'yellow' ? 'bg-yellow-50 text-yellow-700 ring-yellow-200'
                    : 'bg-sky-50 text-sky-700 ring-sky-200';
                  return (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-500">{e.position || '—'}</p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', TYPE_COLOR[e.type].bg, TYPE_COLOR[e.type].text, TYPE_COLOR[e.type].ring)}>
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{wa || '—'}</td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">
                        {format(exp, 'MMM d, yyyy')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1', toneColor)}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{e.state || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expiring.length > 20 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing 20 of {expiring.length}. Export the full list as CSV or PDF for the complete record.
              </p>
            )}
          </div>
        )}
      </ReportCard>

      <ReportCard title="Work Authorization Mix" subtitle="Top 10 authorization types across the filtered workforce" icon={FileText}>
        {authMix.length === 0 ? (
          <EmptyState title="No authorization data" description="No employees with work authorization info in scope." />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Authorization</th>
                <th className="py-2.5 pr-4">Count</th>
                <th className="py-2.5">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {authMix.map((a) => {
                const share = filtered.length ? (a.value / filtered.length) * 100 : 0;
                return (
                  <tr key={a.label} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{a.label}</td>
                    <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{a.value}</td>
                    <td className="py-2.5 min-w-[140px]">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${share}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportCard>

      {metrics.w2Count > 0 && (
        <ReportCard title="W-2 Benefits Adoption" subtitle={`Among ${metrics.w2Count} W-2 employee${metrics.w2Count === 1 ? '' : 's'} in scope`} icon={Heart}>
          <div className="grid gap-4 sm:grid-cols-2">
            <BenefitRow icon={Heart} label="Medical Benefit" enrolled={metrics.withMedical} total={metrics.w2Count} color="#10b981" />
            <BenefitRow icon={Wallet} label="401(k) Enrollment" enrolled={metrics.with401k} total={metrics.w2Count} color="#f59e0b" />
          </div>
        </ReportCard>
      )}
    </div>
  );
}

function BenefitRow({ icon: Icon, label, enrolled, total, color }: { icon: React.ElementType; label: string; enrolled: number; total: number; color: string }) {
  const pct = total ? Math.round((enrolled / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-500">{enrolled} of {total} enrolled</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
