'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus, UserCheck, UserX, Globe, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import EmployeeDataTable from '@/components/dashboard/EmployeeDataTable';
import EmployeeModal from '@/components/dashboard/EmployeeModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.totalEmployees, icon: Users, color: 'indigo', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
          { label: 'Active', value: stats.activeCount, icon: UserCheck, color: 'emerald', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { label: 'Terminated', value: stats.terminatedCount, icon: UserX, color: 'red', bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
          { label: 'Expiring Auth', value: stats.expiringAuthorizations, icon: AlertTriangle, color: 'amber', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className={cn('flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm')}>
            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', stat.iconBg)}>
              <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Type breakdown mini cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { id: 'W2', label: 'W2', count: stats.w2Count, icon: Briefcase, color: 'blue' },
          { id: 'Contract', label: 'Contract', count: stats.contractCount, icon: FileText, color: 'purple' },
          { id: '1099', label: '1099', count: stats.employee1099Count, icon: FileText, color: 'teal' },
          { id: 'Offshore', label: 'Offshore', count: stats.offshoreCount, icon: Globe, color: 'pink' },
        ].map((item) => {
          const colorMap: Record<string, string> = {
            blue: 'border-blue-200 bg-blue-50 text-blue-700',
            purple: 'border-purple-200 bg-purple-50 text-purple-700',
            teal: 'border-teal-200 bg-teal-50 text-teal-700',
            pink: 'border-pink-200 bg-pink-50 text-pink-700',
          };
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as EmployeeType)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm',
                activeTab === item.id ? colorMap[item.color] : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-lg font-bold">{item.count}</p>
              </div>
            </button>
          );
        })}
      </div>

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
