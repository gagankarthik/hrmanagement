'use client';

import * as React from 'react';
import { ShieldCheck, GraduationCap } from 'lucide-react';
import { ChartFrame } from '@/components/dashboard/ChartFrame';
import { FunnelChart, type FunnelStage } from '@/components/dashboard/Charts';
import { useI9 } from '@/context/I9Context';
import { useI983 } from '@/context/I983Context';
import { deriveI9Status, type I9Status } from '@/types/i9';
import { nextEvaluationDue } from '@/types/i983';

const RANK: Record<I9Status, number> = {
  'Not started': 0, 'Section 1 complete': 1, 'Pending verification': 2, 'Verified': 3, 'E-Verified': 4,
};

/**
 * Work-eligibility pipeline — how far each worker's I-9 has progressed
 * (on file → Section 1 → verification → verified → E-Verified) plus a STEM
 * OPT (I-983) evaluation due/overdue summary. None of this was on the dashboard.
 */
export function ComplianceFunnelWidget() {
  const { records: i9, isLoading: i9Loading, fetchRecords } = useI9();
  const { records: i983, isLoading: i983Loading } = useI983();

  const stages: FunnelStage[] = React.useMemo(() => {
    const ranks = i9.filter((r) => r && r.employeeId).map((r) => RANK[r.status ?? deriveI9Status(r)] ?? 0);
    const atLeast = (n: number) => ranks.filter((v) => v >= n).length;
    return [
      { label: 'I-9 on file', value: ranks.length },
      { label: 'Section 1 complete', value: atLeast(1) },
      { label: 'In verification', value: atLeast(2) },
      { label: 'Verified', value: atLeast(3) },
      { label: 'E-Verified', value: atLeast(4) },
    ];
  }, [i9]);

  const { overdue, dueSoon } = React.useMemo(() => {
    let overdue = 0, dueSoon = 0;
    i983.filter((r) => r && r.employeeId).forEach((r) => {
      const next = nextEvaluationDue(r);
      if (!next) return;
      if (next.overdue) overdue += 1;
      else if (next.days <= 30) dueSoon += 1;
    });
    return { overdue, dueSoon };
  }, [i983]);

  const isLoading = (i9Loading || i983Loading) && i9.length === 0 && i983.length === 0;
  const isEmpty = i9.length === 0 && i983.length === 0;

  return (
    <ChartFrame
      title="Work-eligibility pipeline"
      subtitle="I-9 verification progress · STEM OPT evaluations"
      icon={ShieldCheck}
      height={260}
      skeleton="bars"
      isLoading={isLoading}
      isEmpty={isEmpty}
      onRetry={fetchRecords}
      emptyLabel="No I-9 or I-983 records yet"
      emptyCta={{ label: 'Go to I-9', href: '/i9' }}
    >
      <div className="flex flex-col gap-4">
        <FunnelChart stages={stages} showStepConversion={false} />
        {i983.length > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <p className="text-xs text-slate-600">
              STEM OPT evaluations:{' '}
              <span className={overdue ? 'font-bold text-red-600' : 'font-semibold text-slate-900'}>{overdue} overdue</span>
              {' · '}
              <span className={dueSoon ? 'font-semibold text-accent-700' : 'text-slate-500'}>{dueSoon} due in 30 days</span>
            </p>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
