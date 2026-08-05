'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PartnerProfile } from '@/components/dashboard/partners/PartnerProfile';

function ClientDetailPageContent() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id ?? '';
  const { employees } = useEmployees();
  const { clients, isLoading, deleteClient } = useClients();

  const client = useMemo(
    () => (clientId ? clients.find((c) => c.id === clientId) : undefined),
    [clients, clientId],
  );

  const roster = useMemo(() => {
    if (!client) return [];
    return employees.filter((emp) =>
      emp.clientAssignments?.some((a) => a.clientId === client.id) ||
      emp.clientId === client.id ||
      emp.client === client.name,
    );
  }, [employees, client]);

  return (
    <PartnerProfile
      kind="clients"
      singular="Client"
      plural="Clients"
      icon={Building2}
      accent="#0f766e"
      partner={client}
      employees={roster}
      isLoading={isLoading}
      onDelete={async () => { if (client) await deleteClient(client.id); }}
    />
  );
}

export default function ClientDetailPage() {
  return (
    <ErrorBoundary>
      <ClientDetailPageContent />
    </ErrorBoundary>
  );
}
