'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus, UserCheck, UserX, AlertTriangle, Upload } from 'lucide-react';
import EmployeeDataTable from '@/components/dashboard/EmployeeDataTable';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useToast } from '@/components/ui/toast';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { EMPLOYEE_IMPORTS } from '@/lib/bulk-import/configs';
import { Employee, EmployeeType } from '@/types/employee';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type TabType = 'all' | EmployeeType;

const tabs: { id: TabType; label: string; dotColor: string }[] = [
  { id: 'all', label: 'All', dotColor: 'bg-slate-400' },
  { id: 'W2', label: 'W2', dotColor: 'bg-blue-500' },
  { id: 'Contract', label: 'Contract', dotColor: 'bg-purple-500' },
  { id: '1099', label: '1099', dotColor: 'bg-teal-500' },
  { id: 'Offshore', label: 'Offshore', dotColor: 'bg-pink-500' },
];

export default function EmployeesPage() {
  const { employees, isLoading, stats, fetchEmployees } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [importOpen, setImportOpen] = useState(false);

  const filteredByTab = useMemo(() => {
    return activeTab === 'all' ? employees : employees.filter((emp) => emp.type === activeTab);
  }, [employees, activeTab]);

  const getTabCount = (tabId: TabType): number => {
    if (tabId === 'all') return stats.totalEmployees;
    if (tabId === 'W2') return stats.w2Count;
    if (tabId === 'Contract') return stats.contractCount;
    if (tabId === '1099') return stats.employee1099Count;
    if (tabId === 'Offshore') return stats.offshoreCount;
    return 0;
  };

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; employee: Employee | null }>({
    isOpen: false, employee: null,
  });

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        icon={Users}
        eyebrow="Workforce"
        title="Employees"
        description="Manage your entire workforce in one place"
        actions={
          <>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <Link href="/onboard" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Employee
            </Link>
          </>
        }
      />

      {/* Summary Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total" value={stats.totalEmployees} icon={Users} tone="brand" />
        <StatCard label="Active" value={stats.activeCount} icon={UserCheck} tone="emerald" />
        <StatCard label="Terminated" value={stats.terminatedCount} icon={UserX} tone="red" />
        <StatCard label="Expiring Auth" value={stats.expiringAuthorizations} icon={AlertTriangle} tone="amber" />
      </StatGrid>

      {/* Tab navigation */}
      <div className="surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', tab.dotColor)} />
                {tab.label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-brand-100 text-brand-700 font-semibold' : 'bg-slate-100 text-slate-500'
                )}>
                  {count}
                </span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand-600" />}
              </button>
            );
          })}
          </div>
        </div>

        <div className="p-1">
          <EmployeeDataTable
            employees={filteredByTab}
            isLoading={isLoading}
            onView={(emp) => router.push(`/employees/${emp.id}`)}
            onEdit={(emp) => router.push(`/employees/${emp.id}/edit`)}
            onDelete={(emp) => setDeleteModal({ isOpen: true, employee: emp })}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employee: null })}
        employee={deleteModal.employee}
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={EMPLOYEE_IMPORTS}
        title="Import Employees"
        lookups={{ clients, vendors }}
        onImported={(n) => {
          fetchEmployees();
          toast.success('Employees imported', `${n} employee${n !== 1 ? 's' : ''} added.`);
        }}
      />
    </PageContainer>
  );
}
