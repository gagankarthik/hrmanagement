'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { coiStatus } from '@/lib/coi';
import { formatDate } from '@/lib/format';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DetailField, SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { PartnerProfile } from '@/components/dashboard/partners/PartnerProfile';

const COI_TONE: Record<string, StatusTone> = {
  emerald: 'success',
  amber: 'warning',
  red: 'danger',
  slate: 'neutral',
};

function SubcontractorDetailPageContent() {
  const params = useParams<{ id: string }>();
  const subcontractorId = params?.id ?? '';
  const { employees } = useEmployees();
  const { subcontractors, isLoading, deleteSubcontractor } = useSubcontractors();

  const subcontractor = useMemo(
    () => (subcontractorId ? subcontractors.find((s) => s.id === subcontractorId) : undefined),
    [subcontractors, subcontractorId],
  );

  const roster = useMemo(() => {
    if (!subcontractor) return [];
    return employees.filter((emp) =>
      emp.subcontractorAssignments?.some((a) => a.subcontractorId === subcontractor.id) ||
      emp.subcontractorId === subcontractor.id,
    );
  }, [employees, subcontractor]);

  const coi = coiStatus(subcontractor?.coiExpiryDate);

  return (
    <PartnerProfile
      kind="subcontractors"
      singular="Subcontractor"
      plural="Subcontractors"
      icon={UserCheck}
      accent="#0f766e"
      partner={subcontractor}
      employees={roster}
      isLoading={isLoading}
      onDelete={async () => { if (subcontractor) await deleteSubcontractor(subcontractor.id); }}
      extra={
        subcontractor && (
          <SectionCard
            icon={ShieldCheck}
            title="Certificate of Insurance"
            description="Policy dates on file for this subcontractor"
            actions={
              <StatusBadge
                label={coi.label}
                tone={COI_TONE[coi.tone] ?? 'neutral'}
                icon={coi.state === 'valid' ? CheckCircle2 : coi.state === 'none' ? undefined : AlertTriangle}
              />
            }
          >
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField
                label="Policy effective"
                value={subcontractor.coiEffectiveDate ? formatDate(subcontractor.coiEffectiveDate) : undefined}
              />
              <DetailField
                label="Policy expiry"
                value={subcontractor.coiExpiryDate ? formatDate(subcontractor.coiExpiryDate) : undefined}
              />
            </dl>
          </SectionCard>
        )
      }
    />
  );
}

export default function SubcontractorDetailPage() {
  return (
    <ErrorBoundary>
      <SubcontractorDetailPageContent />
    </ErrorBoundary>
  );
}
