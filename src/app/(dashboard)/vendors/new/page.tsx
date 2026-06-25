'use client';

import { Package } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import VendorForm from '@/components/dashboard/VendorForm';

export default function NewVendorPage() {
  return (
    <FormPageShell
      icon={Package}
      eyebrow="Partners"
      title="New Vendor"
      description="Create a new vendor partnership record"
      tone="purple"
      backHref="/vendors"
      backLabel="Back to Vendors"
    >
      <VendorForm mode="create" />
    </FormPageShell>
  );
}
