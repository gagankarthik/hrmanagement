'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { FunnelChart, type FunnelStage } from '@/components/dashboard/Charts';
import { useTimesheets } from '@/context/TimesheetContext';
import { useInvoices } from '@/context/InvoiceContext';
import { useDashboardFilters } from '@/context/DashboardFilterContext';
import { compactUsd } from '@/lib/format';

/**
 * Billing funnel — money flowing from logged time through to cash collected.
 * Logged → Approved → Invoiced → Paid, so revenue leakage between stages is
 * visible at a glance. Honours the dashboard date range.
 */
export function BillingFunnelWidget() {
  const { timesheets, isLoading: tsLoading, fetchTimesheets } = useTimesheets();
  const { invoices, isLoading: invLoading } = useInvoices();
  const { rangeStart, rangeEnd } = useDashboardFilters();

  const inRange = React.useCallback((iso?: string) => {
    if (!rangeStart && !rangeEnd) return true;
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    if (rangeStart && d < rangeStart) return false;
    if (rangeEnd && d > rangeEnd) return false;
    return true;
  }, [rangeStart, rangeEnd]);

  const stages: FunnelStage[] = React.useMemo(() => {
    const ts = timesheets.filter((t) => t && t.id && inRange(t.periodStart));
    const tsValue = (filterFn: (s: string) => boolean) =>
      ts.filter((t) => filterFn(t.status)).reduce((sum, t) => sum + (t.billRate || 0) * (t.hours || 0), 0);

    const logged = tsValue(() => true);
    const approved = tsValue((s) => s === 'Approved' || s === 'Invoiced');

    const inv = invoices.filter((i) => i && i.id && inRange(i.issueDate));
    const invoiced = inv.filter((i) => i.status === 'Sent' || i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const paid = inv.filter((i) => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);

    return [
      { label: 'Time logged', value: Math.round(logged) },
      { label: 'Approved', value: Math.round(approved) },
      { label: 'Invoiced', value: Math.round(invoiced) },
      { label: 'Paid', value: Math.round(paid) },
    ];
  }, [timesheets, invoices, inRange]);

  const isEmpty = stages.every((s) => s.value === 0);
  const isLoading = (tsLoading || invLoading) && timesheets.length === 0 && invoices.length === 0;

  return (
    <ChartFrame
      title="Billing funnel"
      subtitle="Logged → approved → invoiced → paid"
      icon={Filter}
      height={250}
      skeleton="bars"
      isLoading={isLoading}
      isEmpty={isEmpty}
      onRetry={fetchTimesheets}
      emptyLabel="No billing activity in this period"
      emptyHint="Log timesheets with bill rates and raise invoices to see the cash funnel."
      emptyCta={{ label: 'Go to Timesheets', href: '/timesheets' }}
    >
      <FunnelChart stages={stages} format={compactUsd} />
    </ChartFrame>
  );
}
