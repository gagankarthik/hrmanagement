'use client';

import React from 'react';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { ClientProvider } from '@/context/ClientContext';
import { VendorProvider } from '@/context/VendorContext';
import { SubcontractorProvider } from '@/context/SubcontractorContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ClientProvider>
        <VendorProvider>
          <SubcontractorProvider>
            <EmployeeProvider>
              <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="app-canvas flex-1 min-w-0 overflow-y-auto">
                  <div className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-6 pt-16 sm:px-6 lg:px-10 lg:py-8 lg:pt-8">
                    {children}
                  </div>
                </main>
              </div>
            </EmployeeProvider>
          </SubcontractorProvider>
        </VendorProvider>
      </ClientProvider>
    </ProtectedRoute>
  );
}
