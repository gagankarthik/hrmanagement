'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp, Search, DollarSign, Percent, Check, Download } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useToast } from '@/components/ui/toast';
import { exportToCsv } from '@/lib/export';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types/employee';

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function marginTone(pct: number) {
  if (pct >= 30) return { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500' };
  if (pct >= 15) return { badge: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'bg-amber-500' };
  return { badge: 'bg-red-50 text-red-600 ring-red-200', bar: 'bg-red-500' };
}

export default function MarginsPage() {
  const { employees, updateEmployee } = useEmployees();
  const { clients } = useClients();
  const toast = useToast();

  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<string, { billRate: string; payRate: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const clientName = (emp: Employee) => {
    const cid = emp.clientId || emp.clientAssignments?.[0]?.clientId;
    if (cid) return clients.find((c) => c.id === cid)?.name || emp.client || '—';
    return emp.client || '—';
  };

  const valid = employees.filter((e) => e && e.id && (!('status' in e) || e.status !== 'Terminated'));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return valid
      .filter((e) => !q || e.name?.toLowerCase().includes(q) || clientName(e).toLowerCase().includes(q))
      .map((e) => {
        const d = draft[e.id];
        const bill = d ? Number(d.billRate) || 0 : e.billRate ?? 0;
        const pay = d ? Number(d.payRate) || 0 : e.payRate ?? 0;
        const weeklyGp = (bill - pay) * hoursPerWeek;
        const margin = bill > 0 ? ((bill - pay) / bill) * 100 : 0;
        const dirty = !!d && (Number(d.billRate || 0) !== (e.billRate ?? 0) || Number(d.payRate || 0) !== (e.payRate ?? 0));
        return { e, bill, pay, weeklyGp, margin, dirty };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, draft, hoursPerWeek, search, clients]);

  const rated = rows.filter((r) => r.bill > 0);
  const totalWeeklyGp = rated.reduce((s, r) => s + r.weeklyGp, 0);
  const totalWeeklyBill = rated.reduce((s, r) => s + r.bill * hoursPerWeek, 0);
  const blendedMargin = totalWeeklyBill > 0 ? (totalWeeklyGp / totalWeeklyBill) * 100 : 0;

  const setField = (id: string, field: 'billRate' | 'payRate', value: string, emp: Employee) => {
    setDraft((prev) => {
      const base = prev[id] ?? { billRate: String(emp.billRate ?? ''), payRate: String(emp.payRate ?? '') };
      return { ...prev, [id]: { ...base, [field]: value } };
    });
  };

  const saveRow = async (emp: Employee) => {
    const d = draft[emp.id];
    if (!d) return;
    setSavingId(emp.id);
    try {
      await updateEmployee(emp.id, { billRate: Number(d.billRate) || 0, payRate: Number(d.payRate) || 0 });
      setDraft((prev) => {
        const next = { ...prev };
        delete next[emp.id];
        return next;
      });
      toast.success('Rates saved', `${emp.name || 'Worker'} updated.`);
    } catch (err) {
      toast.error('Could not save rates', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleExport = () => {
    exportToCsv('margins', rows as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Worker', value: (r) => (r as unknown as (typeof rows)[number]).e.name || '' },
      { key: 'client', label: 'Client', value: (r) => clientName((r as unknown as (typeof rows)[number]).e) },
      { key: 'bill', label: 'Bill Rate', value: (r) => (r as unknown as (typeof rows)[number]).bill },
      { key: 'pay', label: 'Pay Rate', value: (r) => (r as unknown as (typeof rows)[number]).pay },
      { key: 'weeklyGp', label: `Weekly GP (${hoursPerWeek}h)`, value: (r) => Math.round((r as unknown as (typeof rows)[number]).weeklyGp) },
      { key: 'margin', label: 'Margin %', value: (r) => `${(r as unknown as (typeof rows)[number]).margin.toFixed(1)}%` },
    ]);
  };

  const inputCls =
    'w-24 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-6 pr-2 text-sm text-slate-900 outline-none transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100';

  return (
    <PageContainer>
      <PageHeader
        icon={TrendingUp}
        eyebrow="Billing"
        title="Margins"
        description="Bill rate vs. pay rate for every active placement — weekly gross profit and margin %."
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={rows.length === 0} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" strokeWidth={1.75} /> Export CSV
          </button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Placements priced" value={rated.length} icon={TrendingUp} tone="brand" hint={`${rows.length} active workers`} />
        <StatCard label={`Weekly gross profit`} value={usd0(totalWeeklyGp)} icon={DollarSign} tone="emerald" hint={`at ${hoursPerWeek} hrs/wk`} />
        <StatCard label="Blended margin" value={`${blendedMargin.toFixed(1)}%`} icon={Percent} tone={blendedMargin >= 25 ? 'emerald' : 'amber'} />
        <StatCard label="Annualized GP" value={usd0(totalWeeklyGp * 52)} icon={DollarSign} tone="purple" hint="weekly × 52" />
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
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Hours / week
            <input
              type="number"
              min={1}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Math.max(1, Number(e.target.value) || 40))}
              className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Worker', 'Client', 'Bill / hr', 'Pay / hr', 'Spread', `Weekly GP`, 'Margin', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, bill, pay, weeklyGp, margin, dirty }) => {
                const tone = marginTone(margin);
                return (
                  <tr key={e.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                          {e.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</p>
                          <p className="truncate text-xs text-slate-400">{e.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{clientName(e)}</td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number" min={0} step="0.01"
                          value={draft[e.id]?.billRate ?? (e.billRate ?? '')}
                          onChange={(ev) => setField(e.id, 'billRate', ev.target.value, e)}
                          className={inputCls}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number" min={0} step="0.01"
                          value={draft[e.id]?.payRate ?? (e.payRate ?? '')}
                          onChange={(ev) => setField(e.id, 'payRate', ev.target.value, e)}
                          className={inputCls}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">{bill > 0 ? usd0(bill - pay) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{bill > 0 ? usd0(weeklyGp) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3">
                      {bill > 0 ? (
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', tone.badge)}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">set rates</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => saveRow(e)}
                        disabled={!dirty || savingId === e.id}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                          dirty ? 'bg-brand-600 text-white hover:bg-brand-700' : 'cursor-default bg-slate-100 text-slate-400',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} /> {savingId === e.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-slate-400">No active workers to price yet.</p>
          )}
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Margin % = (bill − pay) ÷ bill. Weekly gross profit assumes {hoursPerWeek} billable hrs/week.</p>
        </div>
      </div>
    </PageContainer>
  );
}
