'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Package } from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useVendors } from '@/context/VendorContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PartnerProfile } from '@/components/dashboard/partners/PartnerProfile';

function VendorDetailPageContent() {
  const params = useParams<{ id: string }>();
  const vendorId = params?.id ?? '';
  const { employees } = useEmployees();
  const { vendors, isLoading, deleteVendor } = useVendors();

  const vendor = useMemo(
    () => (vendorId ? vendors.find((v) => v.id === vendorId) : undefined),
    [vendors, vendorId],
  );

  const roster = useMemo(() => {
    if (!vendor) return [];
    return employees.filter((emp) =>
      emp.vendorAssignments?.some((a) => a.vendorId === vendor.id) ||
      emp.vendorId === vendor.id ||
      emp.vendorName === vendor.name,
    );
  }, [employees, vendor]);

  return (
    <PartnerProfile
      kind="vendors"
      singular="Vendor"
      plural="Vendors"
      icon={Package}
      accent="#7c3aed"
      partner={vendor}
      employees={roster}
      isLoading={isLoading}
      onDelete={async () => { if (vendor) await deleteVendor(vendor.id); }}
    />
  );
}

export default function VendorDetailPage() {
  return (
    <ErrorBoundary>
      <VendorDetailPageContent />
    </ErrorBoundary>
  );
}
