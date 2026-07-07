'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, Clock, Receipt, Banknote } from 'lucide-react';
import { PageContainer } from '@/components/dashboard/page-container';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import MarginsPage from '@/app/(dashboard)/margins/page';
import TimesheetsPage from '@/app/(dashboard)/timesheets/page';
import InvoicesPage from '@/app/(dashboard)/invoices/page';
import PayrollPage from '@/app/(dashboard)/payroll/page';

type TabId = 'margins' | 'timesheets' | 'invoices' | 'payroll';

const TABS: TabItem<TabId>[] = [
  { value: 'margins', label: 'Margins', icon: TrendingUp },
  { value: 'timesheets', label: 'Timesheets', icon: Clock },
  { value: 'invoices', label: 'Invoices', icon: Receipt },
  { value: 'payroll', label: 'Payroll', icon: Banknote },
];

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramTab = searchParams.get('tab') as TabId | null;
  const initial: TabId = TABS.some((t) => t.value === paramTab) ? (paramTab as TabId) : 'margins';
  const [tab, setTab] = useState<TabId>(initial);

  const selectTab = (id: TabId) => {
    setTab(id);
    router.replace(`/billing?tab=${id}`, { scroll: false });
  };

  return (
    <PageContainer>
      <Tabs items={TABS} value={tab} onChange={selectTab} ariaLabel="Billing sections" />

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
