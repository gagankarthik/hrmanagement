'use client';

import React from 'react';
import { configureAmplify } from '@/config/amplify';
import { EmployeeProvider } from '@/context/EmployeeContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopNav from '@/components/dashboard/TopNav';

// Configure Amplify on client side (for DynamoDB access)
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
      <EmployeeProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20">
          <TopNav />
          <main>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </EmployeeProvider>
    </ProtectedRoute>
  );
}
