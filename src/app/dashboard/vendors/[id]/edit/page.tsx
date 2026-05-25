'use client';

import { useParams } from 'next/navigation';
import { Package, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import VendorForm from '@/components/dashboard/VendorForm';
import { useVendors } from '@/context/VendorContext';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function EditVendorPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { vendors, isLoading } = useVendors();
  const vendor = id ? vendors.find((v) => v.id === id) : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Vendor Not Found"
        description="We couldn't find that vendor. They may have been deleted or the link is invalid."
        action={
          <Link href="/dashboard/vendors" className="btn-primary">
            Back to Vendors
          </Link>
        }
        className="mt-12"
      />
    );
  }

  return (
    <FormPageShell
      icon={Package}
      eyebrow="Partners"
      title="Edit Vendor"
      description={`Update details for ${vendor.name}`}
      tone="purple"
      backHref={`/dashboard/vendors/${vendor.id}`}
      backLabel="Back to Vendor"
    >
      <VendorForm mode="edit" initial={vendor} />
    </FormPageShell>
  );
}
