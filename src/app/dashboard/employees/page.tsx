'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import EmployeeDataTable from '@/components/dashboard/EmployeeDataTable';
import EmployeeModal from '@/components/dashboard/EmployeeModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import { useEmployees } from '@/context/EmployeeContext';
import { Employee, EmployeeType } from '@/types/employee';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type TabType = 'all' | EmployeeType;

const tabs: { id: TabType; label: string; color: string }[] = [
  { id: 'all', label: 'All Employees', color: 'bg-slate-500' },
  { id: 'W2', label: 'W2', color: 'bg-blue-500' },
  { id: 'Contract', label: 'Contract', color: 'bg-purple-500' },
  { id: '1099', label: '1099', color: 'bg-teal-500' },
  { id: 'Offshore', label: 'Offshore', color: 'bg-pink-500' },
];

export default function EmployeesPage() {
  const { employees, isLoading, stats } = useEmployees();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Filter employees based on active tab
  const filteredEmployees = useMemo(() => {
    if (activeTab === 'all') return employees;
    return employees.filter((emp) => emp.type === activeTab);
  }, [employees, activeTab]);

  // Get count for each tab
  const getTabCount = (tabId: TabType): number => {
    if (tabId === 'all') return stats.totalEmployees;
    switch (tabId) {
      case 'W2': return stats.w2Count;
      case 'Contract': return stats.contractCount;
      case '1099': return stats.employee1099Count;
      case 'Offshore': return stats.offshoreCount;
      default: return 0;
    }
  };

  // Modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    employee?: Employee;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null,
  });

  const handleEditEmployee = (employee: Employee) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      employee,
    });
  };

  const handleViewEmployee = (employee: Employee) => {
    router.push(`/dashboard/employees/${employee.id}`);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteModal({
      isOpen: true,
      employee,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      employee: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Employees
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View and manage all employee records
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/onboard"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'group relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                )}
              >
                <span className={cn(
                  'h-2 w-2 rounded-full',
                  tab.color
                )} />
                {tab.label}
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}>
                  {count}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Data Table */}
      <EmployeeDataTable
        employees={filteredEmployees}
        isLoading={isLoading}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
      />

      {/* Employee Modal (Edit) */}
      <EmployeeModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        employee={modalState.employee}
        defaultType={activeTab !== 'all' ? activeTab : 'W2'}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        employee={deleteModal.employee}
      />
    </div>
  );
}
