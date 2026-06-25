'use client';

import * as React from 'react';
import { Receipt } from 'lucide-react';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { HBarChart, VIZ } from '@/components/dashboard/Charts';
import { useInvoices } from '@/context/InvoiceContext';
import { compactUsd, fullUsd } from '@/lib/format';

/**
 * Accounts-receivable aging — outstanding (sent, unpaid) invoices bucketed by
 * how overdue they are. Surfaces collection risk the invoice list never aggregates.
 */
const BUCKETS = [
  { key: 'Current', max: 0, color: VIZ.emerald },
  { key: '1–30 days', max: 30, color: VIZ.sky },
  { key: '31–60 days', max: 60, color: VIZ.amber },
  { key: '61–90 days', max: 90, color: VIZ.violet },
  { key: '90+ days', max: Infinity, color: VIZ.rose },
];

export function ArAgingWidget() {
  const { invoices, isLoading, fetchInvoices } = useInvoices();

  const { rows, total } = React.useMemo(() => {
    const now = Date.now();
    const sums: Record<string, number> = {};
    BUCKETS.forEach((b) => { sums[b.key] = 0; });
    let total = 0;

    invoices
      .filter((i) => i && i.id && i.status === 'Sent')
      .forEach((i) => {
        const amt = i.total || 0;
        total += amt;
        const ref = i.dueDate || i.issueDate;
        const due = ref ? new Date(ref) : null;
        const daysPast = due && !Number.isNaN(due.getTime()) ? Math.floor((now - due.getTime()) / 86400000) : 0;
        const bucket = BUCKETS.find((b) => daysPast <= b.max) ?? BUCKETS[BUCKETS.length - 1];
        sums[bucket.key] += amt;
      });

    const rows = BUCKETS
      .map((b) => ({ name: b.key, value: Math.round(sums[b.key]), color: b.color }))
      .filter((r) => r.value > 0);
    return { rows, total };
  }, [invoices]);

  return (
    <ChartFrame
      title="A/R aging"
      subtitle={total > 0 ? `${fullUsd(total)} outstanding` : 'Outstanding receivables by age'}
      icon={Receipt}
      height={240}
      skeleton="hbar"
      isLoading={isLoading && invoices.length === 0}
      isEmpty={rows.length === 0}
      onRetry={fetchInvoices}
      emptyLabel="No outstanding receivables"
      emptyHint="Invoices marked “Sent” and not yet paid will be aged here."
      emptyCta={{ label: 'Go to Invoices', href: '/invoices' }}
    >
      <HBarChart data={rows as Record<string, unknown>[]} categoryKey="name" valueKey="value" money height={240} />
    </ChartFrame>
  );
}
