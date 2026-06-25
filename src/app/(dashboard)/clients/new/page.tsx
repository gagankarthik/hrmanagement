'use client';

import { Building2 } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import ClientForm from '@/components/dashboard/ClientForm';

export default function NewClientPage() {
  return (
    <FormPageShell
      icon={Building2}
      eyebrow="Partners"
      title="New Client"
      description="Create a new client organization record"
      tone="emerald"
      backHref="/clients"
      backLabel="Back to Clients"
    >
      <ClientForm mode="create" />
    </FormPageShell>
  );
}
