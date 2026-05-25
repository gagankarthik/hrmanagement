'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import SubcontractorForm from '@/components/dashboard/SubcontractorForm';

export default function NewSubcontractorPage() {
  return (
    <FormPageShell
      icon={UserCheck}
      eyebrow="Partners"
      title="Add Subcontractor"
      description="Create a new subcontractor record"
      tone="teal"
      backHref="/dashboard/subcontractors"
      backLabel="Back to Subcontractors"
    >
      <SubcontractorForm mode="create" />
    </FormPageShell>
  );
}
