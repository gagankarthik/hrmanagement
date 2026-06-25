'use client';

import React from 'react';
import { HeartPulse } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import BenefitForm from '@/components/dashboard/BenefitForm';

export default function NewBenefitPage() {
  return (
    <FormPageShell
      icon={HeartPulse}
      eyebrow="Company"
      title="Add Benefit Plan"
      description="Create a new benefit plan"
      tone="teal"
      backHref="/benefits"
      backLabel="Back to Benefits"
    >
      <BenefitForm mode="create" />
    </FormPageShell>
  );
}
