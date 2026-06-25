'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Package, Target, UserRoundCheck, Users, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useEndClients } from '@/context/EndClientContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useTimesheets } from '@/context/TimesheetContext';
import type { Employee } from '@/types/employee';

type PartnerRow = { id: string; name: string; contact?: string; status?: string; people: number; revenue?: number };
type TabKey = 'clients' | 'vendors' | 'endclients' | 'subcontractors';

const TABS: { key: TabKey; label: string; icon: React.ElementType; base: string }[] = [
  { key: 'clients', label: 'Clients', icon: Building2, base: '/clients' },
  { key: 'vendors', label: 'Vendors', icon: Package, base: '/vendors' },
  { key: 'endclients', label: 'End Clients', icon: Target, base: '/endclients' },
  { key: 'subcontractors', label: 'Subcontractors', icon: UserRoundCheck, base: '/subcontractors' },
];

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function PartnersPanel() {
  const router = useRouter();
  const { employees } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { endClients } = useEndClients();
  const { subcontractors } = useSubcontractors();
  const { timesheets } = useTimesheets();
  const [tab, setTab] = useState<TabKey>('clients');

  const active = useMemo(() => employees.filter((e) => e && e.id && (e as { status?: string }).status !== 'Terminated'), [employees]);

  // Revenue billed per client (from timesheets)
  const clientRevenue = useMemo(() => {
    const m: Record<string, number> = {};
    timesheets.forEach((t) => { if (t.clientId) m[t.clientId] = (m[t.clientId] || 0) + (t.billRate || 0) * (t.hours || 0); });
    return m;
  }, [timesheets]);

  const clientPeople = (id: string, name: string) =>
    active.filter((e: Employee) => e.clientAssignments?.some((a) => a.clientId === id) || e.clientId === id || e.client === name).length;
  const vendorPeople = (id: string, name: string) =>
    active.filter((e: Employee) => e.vendorAssignments?.some((a) => a.vendorId === id) || e.vendorId === id || e.vendorName === name).length;
  const endClientPeople = (id: string) =>
    active.filter((e: Employee) => e.endClientAssignments?.some((a) => a.clientId === id) || e.endClientId === id).length;
  const subconPeople = (id: string) =>
    active.filter((e: Employee) => e.subcontractorAssignments?.some((a) => a.subcontractorId === id) || e.subcontractorId === id).length;

  const showRevenue = tab === 'clients';

  const rows: PartnerRow[] = useMemo(() => {
    let list: PartnerRow[] = [];
    if (tab === 'clients') {
      list = clients.filter((c) => c && c.id).map((c) => ({ id: c.id, name: c.name, contact: c.contactPerson || c.email, status: c.status, people: clientPeople(c.id, c.name), revenue: clientRevenue[c.id] || 0 }));
    } else if (tab === 'vendors') {
      list = vendors.filter((v) => v && v.id).map((v) => ({ id: v.id, name: v.name, contact: v.contactPerson || v.email, status: v.status, people: vendorPeople(v.id, v.name) }));
    } else if (tab === 'endclients') {
      list = endClients.filter((c) => c && c.id).map((c) => ({ id: c.id, name: c.name, contact: c.contactPerson || c.email, status: c.status, people: endClientPeople(c.id) }));
    } else {
      list = subcontractors.filter((s) => s && s.id).map((s) => ({ id: s.id, name: s.name, contact: s.contactPerson || s.email, status: s.status, people: subconPeople(s.id) }));
    }
    return list.sort((a, b) => (tab === 'clients' ? (b.revenue || 0) - (a.revenue || 0) || b.people - a.people : b.people - a.people)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, clients, vendors, endClients, subcontractors, active, clientRevenue]);

  const counts: Record<TabKey, number> = { clients: clients.length, vendors: vendors.length, endclients: endClients.length, subcontractors: subcontractors.length };
  const base = TABS.find((t) => t.key === tab)!.base;
  const headers = showRevenue ? ['Name', 'Contact', 'People', 'Revenue', 'Status', ''] : ['Name', 'Contact', 'People placed', 'Status', ''];

  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-4">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn('relative flex items-center gap-2 whitespace-nowrap px-3 py-3.5 text-sm font-medium transition-colors', isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700')}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {t.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-xs', isActive ? 'bg-brand-100 font-semibold text-brand-700' : 'bg-slate-100 text-slate-500')}>{counts[t.key]}</span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand-600" />}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">No {TABS.find((t) => t.key === tab)!.label.toLowerCase()} yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {headers.map((h) => <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => router.push(`${base}/${r.id}`)} className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{r.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                      <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{r.contact || <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"><Users className="h-3 w-3" strokeWidth={2} />{r.people}</span>
                  </td>
                  {showRevenue && (
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{r.revenue ? usd0(r.revenue) : <span className="text-slate-300">—</span>}</td>
                  )}
                  <td className="px-5 py-3.5">
                    {r.status === 'Inactive' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200"><XCircle className="h-3 w-3" /> Inactive</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right"><ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">Top {rows.length} of {counts[tab]} by {showRevenue ? 'revenue billed' : 'people placed'}</p>
        <button onClick={() => router.push(base)} className="text-xs font-semibold text-brand-700 hover:underline">View all →</button>
      </div>
    </section>
  );
}
