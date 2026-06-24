'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, ArrowLeft, Printer, Trash2, Check } from 'lucide-react';
import { useInvoices } from '@/context/InvoiceContext';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BRAND } from '@/config/brand';
import { cn } from '@/lib/utils';
import { Invoice, InvoiceStatus, INVOICE_STATUSES } from '@/types/invoice';

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (s?: string) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Sent: 'bg-amber-50 text-amber-700 ring-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

function printInvoice(inv: Invoice) {
  const rows = inv.lineItems
    .map(
      (li) => `<tr>
        <td>${li.description}</td>
        <td style="text-align:right">${li.hours}</td>
        <td style="text-align:right">${usd(li.rate)}</td>
        <td style="text-align:right">${usd(li.amount)}</td>
      </tr>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${inv.invoiceNumber}</title>
  <style>
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:40px;}
    .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
    .brand{font-size:22px;font-weight:800;color:#1d4ed8}
    h1{font-size:28px;margin:0 0 4px;color:#1d4ed8}
    .muted{color:#6b7280;font-size:13px}
    .meta{margin:24px 0;display:flex;gap:48px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#f8fafc;text-align:left;padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}
    td{padding:10px;border-bottom:1px solid #eee;font-size:14px}
    tfoot td{border:0;font-weight:700}
    .total{font-size:20px;color:#1d4ed8}
  </style></head><body>
    <div class="top">
      <div><div class="brand">${BRAND.name}</div><div class="muted">Workforce &amp; staffing</div></div>
      <div style="text-align:right"><h1>Invoice</h1><div class="muted">${inv.invoiceNumber}</div></div>
    </div>
    <div class="meta">
      <div><div class="muted">Bill to</div><div style="font-weight:700">${inv.clientName || '—'}</div></div>
      <div><div class="muted">Period</div><div>${fmtDate(inv.periodStart)} → ${fmtDate(inv.periodEnd)}</div></div>
      <div><div class="muted">Issued</div><div>${fmtDate(inv.issueDate)}</div></div>
      <div><div class="muted">Due</div><div>${fmtDate(inv.dueDate)}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Hours</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3" style="text-align:right">Total</td><td style="text-align:right" class="total">${usd(inv.total)}</td></tr></tfoot></table>
    ${inv.notes ? `<p class="muted" style="margin-top:24px">${inv.notes}</p>` : ''}
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},400)}<\/script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getInvoiceById, updateInvoice, deleteInvoice, isLoading } = useInvoices();
  const toast = useToast();
  const inv = getInvoiceById(id);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!inv) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button onClick={() => router.push('/dashboard/invoices')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to Invoices
        </button>
        <div className="surface p-10 text-center text-sm text-slate-500">{isLoading ? 'Loading invoice…' : 'Invoice not found.'}</div>
      </div>
    );
  }

  const setStatus = async (status: InvoiceStatus) => {
    setBusy(true);
    try {
      await updateInvoice(inv.id, { status });
      toast.success('Invoice updated', `Marked ${status}.`);
    } catch (err) {
      toast.error('Could not update', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteInvoice(inv.id);
      toast.success('Invoice deleted');
      router.push('/dashboard/invoices');
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : 'Please try again.');
      setBusy(false);
      setDel(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/invoices')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to Invoices
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => printInvoice(inv)} className="btn-ghost"><Printer className="h-4 w-4" strokeWidth={1.75} /> Print / PDF</button>
          <button onClick={() => setDel(true)} className="btn-ghost text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" strokeWidth={1.75} /> Delete</button>
        </div>
      </div>

      {/* Status control */}
      <div className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Status
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', STATUS_BADGE[inv.status])}>{inv.status}</span>
        </div>
        <div className="flex gap-1.5">
          {INVOICE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={busy || inv.status === s}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                inv.status === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {inv.status === s && <Check className="h-3.5 w-3.5" strokeWidth={2} />} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice document */}
      <div className="surface overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div>
            <p className="font-display text-xl font-bold text-brand-900">{BRAND.name}</p>
            <p className="text-xs text-slate-400">Workforce &amp; staffing</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2"><Receipt className="h-5 w-5 text-brand-600" strokeWidth={1.75} /><span className="font-display text-lg font-bold text-slate-900">Invoice</span></div>
            <p className="text-sm text-slate-500">{inv.invoiceNumber}</p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bill to</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{inv.clientName || '—'}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Period</p><p className="mt-0.5 text-sm text-slate-700">{fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issued</p><p className="mt-0.5 text-sm text-slate-700">{fmtDate(inv.issueDate)}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due</p><p className="mt-0.5 text-sm text-slate-700">{fmtDate(inv.dueDate)}</p></div>
        </div>

        <div className="overflow-x-auto px-2">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/40">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hours</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rate</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-sm text-slate-700">{li.description}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{li.hours}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{usd(li.rate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{usd(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <div className="w-56">
            <div className="flex items-center justify-between py-1 text-sm text-slate-500"><span>Subtotal</span><span>{usd(inv.subtotal)}</span></div>
            <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2"><span className="font-semibold text-slate-700">Total</span><span className="font-display text-xl font-bold text-brand-900">{usd(inv.total)}</span></div>
          </div>
        </div>

        {inv.notes && <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">{inv.notes}</div>}
      </div>

      <ConfirmDialog
        isOpen={del}
        onClose={() => setDel(false)}
        onConfirm={confirmDelete}
        title="Delete invoice"
        description={<>Delete invoice <span className="font-semibold text-slate-900">{inv.invoiceNumber}</span>? This cannot be undone.</>}
        confirmLabel="Delete"
        isLoading={busy}
      />
    </div>
  );
}
