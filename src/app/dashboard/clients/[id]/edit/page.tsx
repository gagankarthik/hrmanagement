'use client';

import { useParams } from 'next/navigation';
import { Building2, XCircle } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import ClientForm from '@/components/dashboard/ClientForm';
import { useClients } from '@/context/ClientContext';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function EditClientPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { clients, isLoading } = useClients();
  const client = id ? clients.find((c) => c.id === id) : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Client Not Found"
        description="We couldn't find that client. They may have been deleted or the link is invalid."
        action={
          <Link href="/dashboard/clients" className="btn-primary">
            Back to Clients
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
      title="Edit Client"
      description={`Update details for ${client.name}`}
      tone="emerald"
      backHref={`/dashboard/clients/${client.id}`}
      backLabel="Back to Client"
    >
      <ClientForm mode="edit" initial={client} />
    </FormPageShell>
  );
}
