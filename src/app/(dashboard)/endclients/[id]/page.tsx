'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Target } from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useEndClients } from '@/context/EndClientContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PartnerProfile } from '@/components/dashboard/partners/PartnerProfile';

function EndClientDetailPageContent() {
  const params = useParams<{ id: string }>();
  const endClientId = params?.id ?? '';
  const { employees } = useEmployees();
  const { endClients, isLoading, deleteEndClient } = useEndClients();

  const endClient = useMemo(
    () => (endClientId ? endClients.find((c) => c.id === endClientId) : undefined),
    [endClients, endClientId],
  );

  const roster = useMemo(() => {
    if (!endClient) return [];
    return employees.filter((emp) =>
      emp.endClientAssignments?.some((a) => a.clientId === endClient.id) ||
      emp.endClientId === endClient.id,
    );
  }, [employees, endClient]);

  return (
    <PartnerProfile
      kind="endclients"
      singular="End Client"
      plural="End Clients"
      icon={Target}
      accent="#0f766e"
      partner={endClient}
      employees={roster}
      isLoading={isLoading}
      onDelete={async () => { if (endClient) await deleteEndClient(endClient.id); }}
    />
  );
}

export default function EndClientDetailPage() {
  return (
    <ErrorBoundary>
      <EndClientDetailPageContent />
    </ErrorBoundary>
  );
}
