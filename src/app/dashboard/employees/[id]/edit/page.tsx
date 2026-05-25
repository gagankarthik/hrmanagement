'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import EmployeeForm from '@/components/dashboard/EmployeeForm';
import { useEmployees } from '@/context/EmployeeContext';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { employees, isLoading } = useEmployees();

  const employee = React.useMemo(() => employees.find((e) => e.id === id), [employees, id]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Employee Not Found"
        description="We couldn't find that employee. They may have been deleted or the link is invalid."
        action={
          <button onClick={() => router.push('/dashboard/employees')} className="btn-primary">
            Back to Employees
          </button>
        }
        className="mt-12"
      />
    );
  }

  return (
    <FormPageShell
      icon={Users}
      eyebrow="People"
      title="Edit employee"
      description={employee.name}
      tone="brand"
      backHref={`/dashboard/employees/${id}`}
      backLabel="Back to profile"
    >
      <EmployeeForm mode="edit" initial={employee} />
    </FormPageShell>
  );
}
