'use client';

import React, { useState } from 'react';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { ClientProvider } from '@/context/ClientContext';
import { VendorProvider } from '@/context/VendorContext';
import { SubcontractorProvider } from '@/context/SubcontractorContext';
import { LeaveProvider } from '@/context/LeaveContext';
import { AttendanceProvider } from '@/context/AttendanceContext';
import { HandbookProvider } from '@/context/HandbookContext';
import { BenefitsProvider } from '@/context/BenefitsContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
      <ClientProvider>
        <VendorProvider>
          <SubcontractorProvider>
            <EmployeeProvider>
              <BenefitsProvider>
              <HandbookProvider>
                <LeaveProvider>
                <AttendanceProvider>
                  <div className="flex min-h-screen bg-slate-50">
                    <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
                    <main className="app-canvas relative flex-1 min-w-0">
                      <Topbar onMenuClick={() => setMobileNavOpen(true)} />
                      <div className="mx-auto w-full max-w-[1360px] px-3.5 py-5 sm:px-5 lg:px-7 lg:py-6">
                        {children}
                      </div>
                    </main>
                  </div>
                </AttendanceProvider>
                </LeaveProvider>
              </HandbookProvider>
              </BenefitsProvider>
            </EmployeeProvider>
          </SubcontractorProvider>
        </VendorProvider>
      </ClientProvider>
    </ProtectedRoute>
  );
}
