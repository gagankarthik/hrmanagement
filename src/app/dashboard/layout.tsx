'use client';

import React from 'react';
import { configureAmplify } from '@/config/amplify';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { ClientProvider } from '@/context/ClientContext';
import { VendorProvider } from '@/context/VendorContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/dashboard/Sidebar';

if (typeof window !== 'undefined') {
  configureAmplify();
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ClientProvider>
        <VendorProvider>
          <EmployeeProvider>
            <div className="flex min-h-screen bg-slate-50">
              <Sidebar />
              <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pt-14 lg:pt-6">
                  {children}
                </div>
              </main>
            </div>
          </EmployeeProvider>
        </VendorProvider>
      </ClientProvider>
    </ProtectedRoute>
  );
}
