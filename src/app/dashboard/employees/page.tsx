'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus, UserCheck, UserX, Globe, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import EmployeeDataTable from '@/components/dashboard/EmployeeDataTable';
import EmployeeModal from '@/components/dashboard/EmployeeModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useEmployees } from '@/context/EmployeeContext';
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
  const { employees, isLoading, stats, deleteEmployee } = useEmployees();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredByTab = useMemo(() => {
    if (activeTab === 'all') return employees;
    return employees.filter((emp) => emp.type === activeTab);
  }, [employees, activeTab]);

  const getTabCount = (tabId: TabType): number => {
    if (tabId === 'all') return stats.totalEmployees;
    if (tabId === 'W2') return stats.w2Count;
    if (tabId === 'Contract') return stats.contractCount;
    if (tabId === '1099') return stats.employee1099Count;
    if (tabId === 'Offshore') return stats.offshoreCount;
    return 0;
  };

  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; employee?: Employee }>({
    isOpen: false, mode: 'create',
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; employee: Employee | null }>({
    isOpen: false, employee: null,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage your entire workforce in one place</p>
        </div>
        <Link
          href="/dashboard/onboard"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Link>
      </div>

      {/* Summary Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total" value={stats.totalEmployees} icon={Users} tone="indigo" />
        <StatCard label="Active" value={stats.activeCount} icon={UserCheck} tone="emerald" />
        <StatCard label="Terminated" value={stats.terminatedCount} icon={UserX} tone="red" />
        <StatCard label="Expiring Auth" value={stats.expiringAuthorizations} icon={AlertTriangle} tone="amber" />
      </StatGrid>

      {/* Tab navigation */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-1 border-b border-slate-100 px-4">
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', tab.dotColor)} />
                {tab.label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'bg-slate-100 text-slate-500'
                )}>
                  {count}
                </span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-indigo-600" />}
              </button>
            );
          })}
        </div>

        <div className="p-1">
          <EmployeeDataTable
            employees={filteredByTab}
            isLoading={isLoading}
            onView={(emp) => router.push(`/dashboard/employees/${emp.id}`)}
            onEdit={(emp) => setModalState({ isOpen: true, mode: 'edit', employee: emp })}
            onDelete={(emp) => setDeleteModal({ isOpen: true, employee: emp })}
          />
        </div>
      </div>

      <EmployeeModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        employee={modalState.employee}
        defaultType={activeTab !== 'all' ? activeTab : 'W2'}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employee: null })}
        employee={deleteModal.employee}
      />
    </div>
  );
}
