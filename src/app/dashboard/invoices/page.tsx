'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Plus, Trash2, Eye, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { ActionMenu } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useInvoices } from '@/context/InvoiceContext';
import { cn } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/types/invoice';

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (s?: string) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Sent: 'bg-amber-50 text-amber-700 ring-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, isLoading, deleteInvoice } = useInvoices();
  const toast = useToast();
  const [del, setDel] = useState<{ inv: Invoice | null; busy: boolean }>({ inv: null, busy: false });

  const valid = invoices.filter((i) => i && i.id);
  const totalBilled = valid.reduce((s, i) => s + (i.total || 0), 0);
  const outstanding = valid.filter((i) => i.status === 'Sent').reduce((s, i) => s + (i.total || 0), 0);
  const paid = valid.filter((i) => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);

  const confirmDelete = async () => {
    if (!del.inv) return;
    setDel((p) => ({ ...p, busy: true }));
    try {
      await deleteInvoice(del.inv.id);
      toast.success('Invoice deleted');
      setDel({ inv: null, busy: false });
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : 'Please try again.');
      setDel((p) => ({ ...p, busy: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />)}</div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        eyebrow="Billing"
        title="Invoices"
        description="Generate client invoices from approved timesheet hours."
        tone="brand"
        actions={
          <button onClick={() => router.push('/dashboard/invoices/new')} className="btn-primary">
            <Plus className="h-4 w-4" strokeWidth={1.75} /> New invoice
          </button>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Total billed" value={usd(totalBilled)} icon={Receipt} tone="brand" hint={`${valid.length} invoices`} />
        <StatCard label="Outstanding" value={usd(outstanding)} icon={Receipt} tone="amber" hint="status: sent" />
        <StatCard label="Paid" value={usd(paid)} icon={Receipt} tone="emerald" />
      </StatGrid>

      <div className="surface">
        {valid.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Receipt}
              tone="brand"
              title="No invoices yet"
              description="Generate your first client invoice from logged timesheet hours."
              action={<button onClick={() => router.push('/dashboard/invoices/new')} className="btn-primary"><Plus className="h-4 w-4" strokeWidth={1.75} /> New invoice</button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Invoice', 'Client', 'Period', 'Issued', 'Total', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {valid.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                    className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{inv.clientName || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtDate(inv.issueDate)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{usd(inv.total || 0)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', STATUS_BADGE[inv.status])}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <ActionMenu
                          items={[
                            { label: 'View', icon: Eye, onClick: () => router.push(`/dashboard/invoices/${inv.id}`) },
                            { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDel({ inv, busy: false }) },
                          ]}
                        />
                        <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-400">{valid.length} invoice{valid.length !== 1 ? 's' : ''}</p></div>
      </div>

      <ConfirmDialog
        isOpen={del.inv !== null}
        onClose={() => setDel({ inv: null, busy: false })}
        onConfirm={confirmDelete}
        title="Delete invoice"
        description={del.inv ? <>Delete invoice <span className="font-semibold text-slate-900">{del.inv.invoiceNumber}</span>? This cannot be undone.</> : null}
        confirmLabel="Delete"
        isLoading={del.busy}
      />
    </div>
  );
}
