'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import { LeaveForm } from '@/components/dashboard/LeaveForm';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { resolveName } from '@/lib/names';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditLeavePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { leaves, isLoading } = useLeaves();
  const { employees } = useEmployees();

  const leave = useMemo(() => leaves.find((l) => l.id === id), [leaves, id]);

  if (isLoading && !leave) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!leave) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Leave request not found"
        description="It may have been deleted, or the link is invalid."
        className="mt-12"
        action={
          <button onClick={() => router.push('/leaves')} className="btn-primary">Back to Leaves</button>
        }
      />
    );
  }

  const name = resolveName(leave.employeeId, employees, { unknown: 'Unknown employee' });

  return (
    <FormPageShell
      icon={CalendarDays}
      eyebrow="Time & Leave"
      title="Edit leave request"
      description={`Update ${name}'s leave request details`}
      tone="brand"
      backHref={`/leaves/${id}`}
      backLabel="Back to request"
    >
      <LeaveForm mode="edit" initial={leave} />
    </FormPageShell>
  );
}
