'use client';

import React, { useMemo, useState } from 'react';
import { Banknote, Download, Search } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { exportToCsv } from '@/lib/export';
import type { Employee } from '@/types/employee';

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const HOURS_MONTH = 160;

export default function PayrollPage() {
  const { employees } = useEmployees();
  const { clients } = useClients();
  const [search, setSearch] = useState('');

  const clientName = (e: Employee) => {
    const cid = e.clientId || e.clientAssignments?.[0]?.clientId;
    if (cid) return clients.find((c) => c.id === cid)?.name || e.client || '';
    return e.client || '';
  };

  const active = useMemo(
    () => employees.filter((e) => e && e.id && (!('status' in e) || (e as { status?: string }).status !== 'Terminated')),
    [employees],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter((e) => !q || e.name?.toLowerCase().includes(q) || clientName(e).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, search, clients]);

  const monthlyPayroll = active.reduce((s, e) => s + (e.payRate ?? 0) * HOURS_MONTH, 0);
  const withRate = active.filter((e) => (e.payRate ?? 0) > 0).length;

  const handleExport = () => {
    exportToCsv('payroll', active as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Employee' },
      { key: 'personalEmail', label: 'Email', value: (e) => (e.personalEmail as string) || (e.officeEmail as string) || '' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status', value: (e) => (e.status as string) || '' },
      { key: 'payRate', label: 'Pay Rate (hourly)', value: (e) => (e as unknown as Employee).payRate ?? '' },
      { key: 'monthly', label: 'Monthly Pay (est)', value: (e) => Math.round(((e as unknown as Employee).payRate ?? 0) * HOURS_MONTH) },
      { key: 'client', label: 'Client', value: (e) => clientName(e as unknown as Employee) },
      { key: 'workCountry', label: 'Work Country', value: (e) => (e as unknown as Employee).workCountry ?? '' },
      { key: 'i9Status', label: 'I-9 / Eligibility', value: (e) => (e as unknown as Employee).i9Status ?? '' },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Banknote}
        eyebrow="Billing"
        title="Payroll export"
        description="A payroll-ready CSV of your active workforce — import into your payroll provider or PEO."
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={!active.length} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" strokeWidth={1.75} /> Export payroll CSV
          </button>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Active workers" value={active.length} icon={Banknote} tone="brand" hint={`${withRate} with a pay rate`} />
        <StatCard label="Monthly payroll (est)" value={usd0(monthlyPayroll)} icon={Banknote} tone="emerald" hint={`${HOURS_MONTH} hrs/mo`} />
        <StatCard label="Annual payroll (est)" value={usd0(monthlyPayroll * 12)} icon={Banknote} tone="purple" />
      </StatGrid>

      <div className="surface">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worker or client…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <p className="text-xs text-slate-400">Set pay rates on the Margins page.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee', 'Type', 'Pay / hr', 'Monthly (est)', 'Client', 'Country', 'I-9'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                        {e.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{e.type}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{e.payRate ? usd0(e.payRate) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-900">{e.payRate ? usd0(e.payRate * HOURS_MONTH) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{clientName(e) || <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{e.workCountry || <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{e.i9Status || <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">No active workers.</p>}
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Monthly estimate assumes {HOURS_MONTH} hours/month. Export produces a provider-agnostic payroll CSV.</p>
        </div>
      </div>
    </div>
  );
}
