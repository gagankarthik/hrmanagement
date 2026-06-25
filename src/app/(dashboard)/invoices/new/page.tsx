'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2, RefreshCw, Trash2, Save } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import { useClients } from '@/context/ClientContext';
import { useTimesheets } from '@/context/TimesheetContext';
import { useInvoices } from '@/context/InvoiceContext';
import { useToast } from '@/components/ui/toast';
import { InvoiceLineItem } from '@/types/invoice';

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { clients } = useClients();
  const { timesheets, updateTimesheet } = useTimesheets();
  const { createInvoice } = useInvoices();
  const toast = useToast();

  const [clientId, setClientId] = useState('');
  const [periodStart, setPeriodStart] = useState(addDays(todayISO(), -7));
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [markInvoiced, setMarkInvoiced] = useState(true);
  const [saving, setSaving] = useState(false);

  const clientName = clients.find((c) => c.id === clientId)?.name ?? '';

  const loadTimesheets = () => {
    if (!clientId) {
      toast.error('Pick a client', 'Choose which client to invoice.');
      return;
    }
    const matched = timesheets.filter(
      (t) =>
        t.clientId === clientId &&
        t.status !== 'Invoiced' &&
        t.periodStart >= periodStart &&
        t.periodStart <= periodEnd,
    );
    const items: InvoiceLineItem[] = matched.map((t) => ({
      timesheetId: t.id,
      employeeId: t.employeeId,
      description: `${t.employeeName || 'Worker'} · ${t.periodStart} → ${t.periodEnd}`,
      hours: t.hours || 0,
      rate: t.billRate || 0,
      amount: (t.hours || 0) * (t.billRate || 0),
    }));
    setLineItems(items);
    setLoaded(true);
    if (items.length === 0) toast.info('No matching timesheets', 'No un-invoiced timesheets for that client and period.');
  };

  const removeItem = (idx: number) => setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const total = subtotal;

  const save = async () => {
    if (!clientId || lineItems.length === 0) {
      toast.error('Nothing to invoice', 'Load at least one timesheet line first.');
      return;
    }
    setSaving(true);
    try {
      const invoice = await createInvoice({
        clientId,
        clientName,
        periodStart,
        periodEnd,
        issueDate,
        dueDate,
        lineItems,
        subtotal,
        total,
        status: 'Draft',
        notes,
      });
      if (markInvoiced) {
        await Promise.all(
          lineItems
            .filter((li) => li.timesheetId)
            .map((li) => updateTimesheet(li.timesheetId as string, { status: 'Invoiced' })),
        );
      }
      toast.success('Invoice created', `${invoice.invoiceNumber} · ${usd(total)}`);
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      toast.error('Could not create invoice', err instanceof Error ? err.message : 'Please try again.');
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100';
  const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

  return (
    <FormPageShell
      icon={Receipt}
      eyebrow="Billing"
      title="New invoice"
      description="Generate a client invoice from logged timesheet hours"
      tone="brand"
      backHref="/invoices"
      backLabel="Back to Invoices"
      maxWidth="max-w-4xl"
    >
      <div className="surface space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className={label}>Client *</label>
            <select value={clientId} onChange={(e) => { setClientId(e.target.value); setLoaded(false); setLineItems([]); }} className={input}>
              <option value="">Select a client…</option>
              {clients.filter((c) => c && c.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Period start</label>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Period end</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Issue date</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={loadTimesheets} className="btn-ghost w-full">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} /> Load timesheets
            </button>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Description', 'Hours', 'Rate', 'Amount', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">{loaded ? 'No un-invoiced timesheets for this client and period.' : 'Choose a client and period, then load timesheets.'}</td></tr>
              ) : (
                lineItems.map((li, idx) => (
                  <tr key={`${li.timesheetId}-${idx}`} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{li.description}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{li.hours}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{usd(li.rate)}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-slate-900">{usd(li.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => removeItem(idx)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Remove line">
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {lineItems.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-100 bg-slate-50/40">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-500">Total</td>
                  <td className="px-4 py-3 font-display text-lg font-bold text-slate-900">{usd(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Payment terms, PO number, etc." className={input} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={markInvoiced} onChange={(e) => setMarkInvoiced(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
            Mark included timesheets as Invoiced
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.push('/invoices')} className="btn-ghost">Cancel</button>
            <button type="button" onClick={save} disabled={saving || lineItems.length === 0} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
              Create invoice
            </button>
          </div>
        </div>
      </div>
    </FormPageShell>
  );
}
