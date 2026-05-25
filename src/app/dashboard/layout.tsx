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
                <main className="flex-1 min-w-0 overflow-y-auto">
                  <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pt-14 lg:pt-6 bg-[#f4f5f7]">
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
