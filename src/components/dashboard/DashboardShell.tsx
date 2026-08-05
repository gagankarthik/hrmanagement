'use client';

import React, { useState } from 'react';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { ClientProvider } from '@/context/ClientContext';
import { EndClientProvider } from '@/context/EndClientContext';
import { VendorProvider } from '@/context/VendorContext';
import { SubcontractorProvider } from '@/context/SubcontractorContext';
import { LeaveProvider } from '@/context/LeaveContext';
import { AttendanceProvider } from '@/context/AttendanceContext';
import { HandbookProvider } from '@/context/HandbookContext';
import { BenefitsProvider } from '@/context/BenefitsContext';
import { TimesheetProvider } from '@/context/TimesheetContext';
import { InvoiceProvider } from '@/context/InvoiceContext';
import { I9Provider } from '@/context/I9Context';
import { I983Provider } from '@/context/I983Context';
import { EmployeeDocsProvider } from '@/context/EmployeeDocsContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ProtectedRoute>
      <ClientProvider>
        <EndClientProvider>
        <VendorProvider>
          <SubcontractorProvider>
            <EmployeeProvider>
              <BenefitsProvider>
              <HandbookProvider>
                <LeaveProvider>
                <AttendanceProvider>
                <TimesheetProvider>
                <InvoiceProvider>
                <I9Provider>
                <I983Provider>
                <EmployeeDocsProvider>
                <OnboardingProvider>
                  {/* Console shell: sidebar + topbar share one borderless chrome
                      surface; the content is a rounded canvas card that is its
                      own scroll container (same shell as the company admin). */}
                  <div className="adm-scope flex min-h-screen bg-[var(--adm-chrome)]">
                    <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
                    <div className="min-w-0 flex-1 bg-[var(--adm-chrome)]">
                      <Topbar onMenuClick={() => setMobileNavOpen(true)} />
                      <main
                        id="main"
                        className="relative flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-y-auto overflow-x-hidden rounded-tl-2xl bg-[var(--adm-canvas)]"
                      >
                        <div className="w-full px-3.5 py-5 sm:px-5 lg:px-6 lg:py-6">
                          {children}
                        </div>
                      </main>
                    </div>
                  </div>
                </OnboardingProvider>
                </EmployeeDocsProvider>
                </I983Provider>
                </I9Provider>
                </InvoiceProvider>
                </TimesheetProvider>
                </AttendanceProvider>
                </LeaveProvider>
              </HandbookProvider>
              </BenefitsProvider>
            </EmployeeProvider>
          </SubcontractorProvider>
        </VendorProvider>
        </EndClientProvider>
      </ClientProvider>
    </ProtectedRoute>
  );
}
