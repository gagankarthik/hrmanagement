'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HeartPulse, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import BenefitForm from '@/components/dashboard/BenefitForm';
import { useBenefits } from '@/context/BenefitsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function EditBenefitPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { plans, isLoading } = useBenefits();

  const plan = useMemo(() => plans.find((p) => p.id === id), [plans, id]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Benefit Plan Not Found"
        description="We couldn't find that benefit plan. It may have been deleted or the link is invalid."
        action={
          <button onClick={() => router.push('/benefits')} className="btn-primary">
            Back to Benefits
          </button>
        }
        className="mt-12"
      />
    );
  }

  return (
    <FormPageShell
      icon={HeartPulse}
      eyebrow="Company"
      title="Edit Benefit Plan"
      description={`Update details for ${plan.name}`}
      tone="teal"
      backHref={`/benefits/${plan.id}`}
      backLabel="Back to Plan"
    >
      <BenefitForm mode="edit" initial={plan} />
    </FormPageShell>
  );
}
