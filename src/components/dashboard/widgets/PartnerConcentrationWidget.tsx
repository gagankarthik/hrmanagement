'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Network, ChevronRight } from 'lucide-react';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { ProgressRing } from '@/components/dashboard/dashboard-ui';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import type { Employee } from '@/types/employee';

const isActive = (e: Employee) => !('status' in e) || (e as { status?: string }).status !== 'Terminated';
const primaryClient = (e: Employee) =>
  e.clientId || e.clientAssignments?.find((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= new Date()))?.clientId;

/**
 * Partner concentration — how dependent the business is on its top client, plus
 * the active partner-network footprint. A single-client share over 40% is a
 * revenue-risk signal the partner list never reveals.
 */
export function PartnerConcentrationWidget() {
  const router = useRouter();
  const { employees, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { subcontractors } = useSubcontractors();

  const { top, topShare, totalPlaced, activeClients, activeVendors, activeSubs } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let totalPlaced = 0;
    employees.filter((e) => e && e.id && isActive(e)).forEach((e) => {
      const cid = primaryClient(e);
      if (!cid) return;
      counts[cid] = (counts[cid] || 0) + 1;
      totalPlaced += 1;
    });
    const ranked = Object.entries(counts)
      .map(([id, n]) => ({ id, name: clients.find((c) => c.id === id)?.name || 'Unknown client', n }))
      .sort((a, b) => b.n - a.n);
    const top = ranked.slice(0, 3);
    const topShare = totalPlaced && ranked[0] ? Math.round((ranked[0].n / totalPlaced) * 100) : 0;
    return {
      top, topShare, totalPlaced,
      activeClients: clients.filter((c) => c.status !== 'Inactive').length,
      activeVendors: vendors.filter((v) => v.status !== 'Inactive').length,
      activeSubs: subcontractors.filter((s) => s.status !== 'Inactive').length,
    };
  }, [employees, clients, vendors, subcontractors]);

  const risky = topShare >= 40;
  const ringColor = risky ? '#dc2626' : topShare >= 25 ? '#d97706' : '#15847a';

  return (
    <ChartFrame
      title="Partner concentration"
      subtitle="Top-client dependency & network footprint"
      icon={Network}
      height={240}
      skeleton="list"
      isLoading={isLoading && employees.length === 0}
      isEmpty={totalPlaced === 0}
      emptyLabel="No active placements yet"
      emptyHint="Assign employees to clients to see concentration risk."
      emptyCta={{ label: 'Go to Partners', href: '/partners' }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing value={topShare} size={72} stroke={8} color={ringColor} label={`${topShare}%`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{top[0]?.name ?? '—'}</p>
            <p className="text-xs text-slate-500">
              Top client holds {topShare}% of {totalPlaced} active placement{totalPlaced === 1 ? '' : 's'}
            </p>
            {risky && <p className="mt-0.5 text-[11px] font-semibold text-red-600">⚠ High single-client dependency</p>}
          </div>
        </div>

        <ul className="space-y-1">
          {top.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => router.push(`/clients/${c.id}`)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="truncate text-sm text-slate-700">{c.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="tnum text-xs font-semibold text-slate-900">{c.n}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          {[
            { label: 'Clients', value: activeClients },
            { label: 'Vendors', value: activeVendors },
            { label: 'Subs', value: activeSubs },
          ].map((s) => (
            <div key={s.label}>
              <p className="tnum font-display text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500">Active {s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}
