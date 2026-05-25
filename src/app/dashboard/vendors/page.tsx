'use client';

import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Pencil, Trash2, Users, Search,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight
} from 'lucide-react';
import VendorModal from '@/components/dashboard/VendorModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useVendors } from '@/context/VendorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Vendor } from '@/types/vendor';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

export default function VendorsPage() {
  const { vendors, isLoading, deleteVendor } = useVendors();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; vendor?: Vendor }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ vendor: Vendor | null; isDeleting: boolean }>({
    vendor: null, isDeleting: false,
  });
  const toast = useToast();

  const getVendorEmps = (vendorId: string, vendorName: string) =>
    employees.filter((emp) =>
      emp.vendorAssignments?.some((a) => a.vendorId === vendorId) ||
      emp.vendorId === vendorId ||
      emp.vendorName === vendorName
    );

  const getEffectiveStatus = (vendor: Vendor): { status: 'Active' | 'Inactive'; autoInactive: boolean } => {
    const emps = getVendorEmps(vendor.id, vendor.name);
    const allTerminated = emps.length > 0 && emps.every((e) => 'status' in e && e.status === 'Terminated');
    return { status: allTerminated ? 'Inactive' : vendor.status, autoInactive: allTerminated };
  };

  const validVendors = vendors.filter((v) => v && v.id);

  const enriched = useMemo(() =>
    validVendors.map((v) => ({ ...v, ...getEffectiveStatus(v), empCount: getVendorEmps(v.id, v.name).length })),
    [validVendors, employees]
  );

  const filtered = enriched.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.contactPerson?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = enriched.filter((v) => v.status === 'Active').length;
  const totalInactive = enriched.filter((v) => v.status === 'Inactive').length;

  const handleDelete = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    setDeleteState({ vendor, isDeleting: false });
  };

  const confirmDelete = async () => {
    const vendor = deleteState.vendor;
    if (!vendor) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteVendor(vendor.id);
      toast.success('Vendor deleted', `${vendor.name} has been removed.`);
      setDeleteState({ vendor: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete vendor', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Package}
        eyebrow="Partners"
        title="Vendors"
        description="Manage vendor partnerships and contractor firms placed through them"
        tone="purple"
        actions={
          <button
            onClick={() => setModalState({ isOpen: true, mode: 'create' })}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        }
      />

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard label="Total vendors" value={validVendors.length} icon={Package} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={validVendors.length ? `${Math.round((totalActive / validVendors.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={validVendors.length ? `${Math.round((totalInactive / validVendors.length) * 100)}% of total` : undefined} />
      </StatGrid>

      {/* Table card */}
      <div className="surface">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Package}
              tone="purple"
              title={searchQuery ? 'No vendors match your search' : 'No vendors yet'}
              description={searchQuery ? 'Try different keywords or clear filters.' : 'Add your first vendor to start tracking partnerships.'}
              action={
                !searchQuery ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" /> Add Vendor
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Vendor', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor, idx) => (
                  <tr
                    key={vendor.id ?? idx}
                    onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
                    className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700">
                          {vendor.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{vendor.name}</p>
                          {vendor.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{vendor.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{vendor.contactPerson || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      {vendor.email
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{vendor.email}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {vendor.phone
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{vendor.phone}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <Users className="h-3 w-3" />{vendor.empCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Status with tooltip when auto-inactive */}
                      <div className="relative w-fit">
                        {vendor.autoInactive ? (
                          <div className="group/tip relative">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 cursor-default">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-20">
                              <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
                                All employees are terminated
                              </div>
                              <div className="ml-2.5 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                            </div>
                          </div>
                        ) : vendor.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => setModalState({ isOpen: true, mode: 'edit', vendor })}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, vendor)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {filtered.length} of {validVendors.length} vendor{validVendors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <VendorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        vendor={modalState.vendor}
      />

      <ConfirmDialog
        isOpen={deleteState.vendor !== null}
        onClose={() => setDeleteState({ vendor: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        description={
          deleteState.vendor ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.vendor.name}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Vendor"
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}
