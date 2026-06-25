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
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PreferencesProvider } from '@/context/PreferencesContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ProtectedRoute>
      <PreferencesProvider>
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
                  <div className="flex min-h-screen bg-slate-50">
                    <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
                    <main className="app-canvas relative flex-1 min-w-0">
                      <Topbar onMenuClick={() => setMobileNavOpen(true)} />
                      <div className="mx-auto w-full max-w-[1360px] px-3.5 py-5 sm:px-5 lg:px-7 lg:py-6">
                        {children}
                      </div>
                    </main>
                  </div>
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
      </PreferencesProvider>
    </ProtectedRoute>
  );
}
