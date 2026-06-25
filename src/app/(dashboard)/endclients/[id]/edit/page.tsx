'use client';

import { useParams } from 'next/navigation';
import { Building2, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import EndClientForm from '@/components/dashboard/EndClientForm';
import { useEndClients } from '@/context/EndClientContext';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function EditEndClientPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { endClients, isLoading } = useEndClients();
  const endClient = id ? endClients.find((c) => c.id === id) : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!endClient) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="End Client Not Found"
        description="We couldn't find that end client. They may have been deleted or the link is invalid."
        action={
          <Link href="/endclients" className="btn-primary">
            Back to End Clients
          </Link>
        }
        className="mt-12"
      />
    );
  }

  return (
    <FormPageShell
      icon={Building2}
      eyebrow="Partners"
      title="Edit End Client"
      description={`Update details for ${endClient.name}`}
      tone="emerald"
      backHref={`/endclients/${endClient.id}`}
      backLabel="Back to End Client"
    >
      <EndClientForm mode="edit" initial={endClient} />
    </FormPageShell>
  );
}
