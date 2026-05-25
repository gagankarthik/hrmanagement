'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserCheck, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import SubcontractorForm from '@/components/dashboard/SubcontractorForm';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function EditSubcontractorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { subcontractors, isLoading } = useSubcontractors();

  const subcontractor = useMemo(
    () => subcontractors.find((s) => s.id === id),
    [subcontractors, id]
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Subcontractor Not Found"
        description="We couldn't find that subcontractor. It may have been deleted or the link is invalid."
        action={
          <button onClick={() => router.push('/dashboard/subcontractors')} className="btn-primary">
            Back to Subcontractors
          </button>
        }
        className="mt-12"
      />
    );
  }

  return (
    <FormPageShell
      icon={UserCheck}
      eyebrow="Partners"
      title="Edit Subcontractor"
      description={`Update details for ${subcontractor.name}`}
      tone="teal"
      backHref={`/dashboard/subcontractors/${subcontractor.id}`}
      backLabel="Back to Subcontractor"
    >
      <SubcontractorForm mode="edit" initial={subcontractor} />
    </FormPageShell>
  );
}
