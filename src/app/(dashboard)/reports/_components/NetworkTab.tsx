import React from 'react';
import { Building2, Package } from 'lucide-react';
import { resolveName } from '@/lib/names';
import { Employee } from '@/types/employee';
import { DonutChart, CompareBarChart, VIZ } from '@/components/dashboard/Charts';
import { TabProps, isActive } from './shared';
import { ChartCard, ReportCard } from './report-cards';

export function NetworkTab({ filtered, clients = [], vendors = [] }: TabProps) {
  const distribute = (
    pickIds: (e: Employee) => string[],
    lookup: { id: string; name: string }[],
    unknownLabel = 'Unknown',
  ) => {
    const dist: Record<string, { id: string; name: string; count: number; active: number }> = {};
    filtered.forEach((e) => {
      Array.from(new Set(pickIds(e))).forEach((id) => {
        const known = lookup.some((x) => x.id === id);
        const name = resolveName(id, lookup, { unknown: unknownLabel });
        const key = known ? id : `name:${name.toLowerCase()}`;
        if (!dist[key]) dist[key] = { id: known ? id : '', name, count: 0, active: 0 };
        dist[key].count += 1;
        if (isActive(e)) dist[key].active += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count);
  };

  const topClients = distribute(
    (e) => e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []),
    clients, 'Unknown client'
  );
  const topVendors = distribute(
    (e) => e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []),
    vendors, 'Unknown vendor'
  );
  const topEndClients = distribute(
    (e) => e.endClientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.endClientId ? [e.endClientId] : []),
    clients, 'Unknown end client'
  );
  const topEndVendors = distribute(
    (e) => e.endVendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.endVendorId ? [e.endVendorId] : []),
    vendors, 'Unknown end vendor'
  );

  const sumCount = (items: { count: number }[]) => items.reduce((s, i) => s + i.count, 0);
  const sumActive = (items: { active: number }[]) => items.reduce((s, i) => s + i.active, 0);

  // ── Interactive chart data (reuses the distribute() results) ──
  const networkCompare = [
    { channel: 'Clients', Placements: sumCount(topClients), Active: sumActive(topClients) },
    { channel: 'Vendors', Placements: sumCount(topVendors), Active: sumActive(topVendors) },
    ...(topEndClients.length ? [{ channel: 'End-Clients', Placements: sumCount(topEndClients), Active: sumActive(topEndClients) }] : []),
    ...(topEndVendors.length ? [{ channel: 'End-Vendors', Placements: sumCount(topEndVendors), Active: sumActive(topEndVendors) }] : []),
  ];
  const networkPie = [
    { name: 'Clients', value: sumCount(topClients), color: VIZ.emerald },
    { name: 'Vendors', value: sumCount(topVendors), color: VIZ.violet },
    ...(topEndClients.length ? [{ name: 'End-Clients', value: sumCount(topEndClients), color: VIZ.teal }] : []),
    ...(topEndVendors.length ? [{ name: 'End-Vendors', value: sumCount(topEndVendors), color: VIZ.amber }] : []),
  ].filter((d) => d.value > 0);
  const hasNetwork = networkPie.length > 0;

  return (
    <div className="space-y-6">
      {/* Interactive visuals */}
      {hasNetwork && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Placements by Channel" subtitle="Clients vs Vendors — total vs active" icon={Building2} delay={40}>
            <CompareBarChart
              data={networkCompare}
              xKey="channel"
              bars={[
                { key: 'Placements', name: 'Placements', color: VIZ.blue },
                { key: 'Active', name: 'Active', color: VIZ.emerald },
              ]}
            />
          </ChartCard>
          <ChartCard title="Network Share" subtitle="Placement distribution across channels" icon={Package} delay={120}>
            <DonutChart data={networkPie} />
          </ChartCard>
        </div>
      )}

      <NetworkTable title="Clients" items={topClients} icon={Building2} accent="#10b981" />
      <NetworkTable title="Vendors" items={topVendors} icon={Package} accent="#a855f7" />
      {topEndClients.length > 0 && <NetworkTable title="End-Clients" items={topEndClients} icon={Building2} accent="#14b8a6" />}
      {topEndVendors.length > 0 && <NetworkTable title="End-Vendors" items={topEndVendors} icon={Package} accent="#f59e0b" />}
    </div>
  );
}

function NetworkTable({ title, items, icon: Icon, accent }: { title: string; items: { id: string; name: string; count: number; active: number }[]; icon: React.ElementType; accent: string }) {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <ReportCard title={`Top ${title}`} subtitle={`${items.length} ${title.toLowerCase()} · ${total} placements total`} icon={Icon}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="py-2.5 pr-4">Rank</th>
            <th className="py-2.5 pr-4">{title}</th>
            <th className="py-2.5 pr-4">Placements</th>
            <th className="py-2.5 pr-4">Active</th>
            <th className="py-2.5">Share</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 12).map((item, i) => {
            const share = total ? (item.count / total) * 100 : 0;
            return (
              <tr key={item.id || item.name} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{String(i + 1).padStart(2, '0')}</td>
                <td className="py-2.5 pr-4 font-medium text-slate-900">{item.name}</td>
                <td className="py-2.5 pr-4 font-bold tabular-nums text-slate-900">{item.count}</td>
                <td className="py-2.5 pr-4 tabular-nums text-emerald-700">{item.active}</td>
                <td className="py-2.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: accent }} />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{share.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ReportCard>
  );
}
