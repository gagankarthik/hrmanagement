'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, Clock, Receipt, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/dashboard/page-container';
import MarginsPage from '@/app/dashboard/margins/page';
import TimesheetsPage from '@/app/dashboard/timesheets/page';
import InvoicesPage from '@/app/dashboard/invoices/page';
import PayrollPage from '@/app/dashboard/payroll/page';

type TabId = 'margins' | 'timesheets' | 'invoices' | 'payroll';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'margins', label: 'Margins', icon: TrendingUp },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
];

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramTab = searchParams.get('tab') as TabId | null;
  const initial: TabId = TABS.some((t) => t.id === paramTab) ? (paramTab as TabId) : 'margins';
  const [tab, setTab] = useState<TabId>(initial);

  const selectTab = (id: TabId) => {
    setTab(id);
    router.replace(`/dashboard/billing?tab=${id}`, { scroll: false });
  };

  return (
    <PageContainer>
      {/* Tabs */}
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max items-center gap-1" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={cn(
                  'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {t.label}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-brand-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'margins' && <MarginsPage />}
      {tab === 'timesheets' && <TimesheetsPage />}
      {tab === 'invoices' && <InvoicesPage />}
      {tab === 'payroll' && <PayrollPage />}
    </PageContainer>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  );
}
