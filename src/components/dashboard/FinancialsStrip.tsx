'use client';

import React, { useMemo } from 'react';
import { DollarSign, Percent, UserMinus, TrendingUp } from 'lucide-react';
import { Employee } from '@/types/employee';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const HOURS_WEEK = 40;
const HOURS_MONTH = 160;

function isActive(e: Employee) {
  return 'status' in e ? (e as { status?: string }).status === 'Active' : true;
}
function isBillable(e: Employee) {
  return 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
}
function hasClient(e: Employee) {
  const now = new Date();
  return (
    e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
    Boolean(e.clientId || e.client)
  );
}

/**
 * Financial KPIs derived from the bill/pay rates set on the Margins dashboard:
 * weekly gross profit, blended margin, and the monthly cost of the bench.
 */
export default function FinancialsStrip({ employees }: { employees: Employee[] }) {
  const m = useMemo(() => {
    const active = employees.filter(isActive);

    let weeklyGp = 0;
    let weeklyBill = 0;
    let priced = 0;
    for (const e of active) {
      const bill = e.billRate ?? 0;
      const pay = e.payRate ?? 0;
      if (bill > 0 && isBillable(e)) {
        weeklyGp += (bill - pay) * HOURS_WEEK;
        weeklyBill += bill * HOURS_WEEK;
        priced += 1;
      }
    }
    const blendedMargin = weeklyBill > 0 ? (weeklyGp / weeklyBill) * 100 : 0;

    const bench = active.filter((e) => !isBillable(e) || !hasClient(e));
    const benchCostMonthly = bench.reduce((s, e) => s + (e.payRate ?? 0) * HOURS_MONTH, 0);

    return { weeklyGp, blendedMargin, priced, benchCount: bench.length, benchCostMonthly };
  }, [employees]);

  return (
    <StatGrid cols={4}>
      <StatCard label="Weekly gross profit" value={usd0(m.weeklyGp)} icon={DollarSign} tone="emerald" hint={`${m.priced} billable placements`} />
      <StatCard label="Blended margin" value={`${m.blendedMargin.toFixed(1)}%`} icon={Percent} tone={m.blendedMargin >= 25 ? 'emerald' : 'amber'} hint="bill vs pay" />
      <StatCard label="Annualized GP" value={usd0(m.weeklyGp * 52)} icon={TrendingUp} tone="purple" hint="weekly × 52" />
      <StatCard label="Bench cost / mo" value={usd0(m.benchCostMonthly)} icon={UserMinus} tone="amber" hint={`${m.benchCount} on bench`} />
    </StatGrid>
  );
}
