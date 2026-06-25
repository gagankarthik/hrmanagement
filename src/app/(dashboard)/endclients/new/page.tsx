'use client';

import { Building2 } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import EndClientForm from '@/components/dashboard/EndClientForm';

export default function NewEndClientPage() {
  return (
    <FormPageShell
      icon={Building2}
      eyebrow="Partners"
      title="New End Client"
      description="Create a new end client organization record"
      tone="emerald"
      backHref="/endclients"
      backLabel="Back to End Clients"
    >
      <EndClientForm mode="create" />
    </FormPageShell>
  );
}
