'use client';

import React, { useState } from 'react';
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
import { Employee } from '@/types/employee';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
  const { employees, isLoading, stats, error, fetchEmployees } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const toast = useToast();
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);

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

      {/* Workforce table — search + type/status dropdown filters live in one toolbar row */}
      <div className="surface overflow-hidden">
        <EmployeeDataTable
          employees={employees}
          isLoading={isLoading}
          error={error}
          onRetry={fetchEmployees}
          onView={(emp) => router.push(`/employees/${emp.id}`)}
          onEdit={(emp) => router.push(`/employees/${emp.id}/edit`)}
          onDelete={(emp) => setDeleteModal({ isOpen: true, employee: emp })}
        />
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
