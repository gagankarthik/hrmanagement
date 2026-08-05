'use client';

import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Pencil, Trash2, Users, Search, Eye,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download, Upload
} from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import { addressSearchText, formatAddress } from '@/lib/address';
import { formatDate } from '@/lib/format';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { VENDOR_IMPORT } from '@/lib/bulk-import/configs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { useVendors } from '@/context/VendorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Vendor } from '@/types/vendor';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ColumnToggle } from '@/components/ui/column-toggle';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterSelect } from '@/components/ui/filter-select';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';
import { friendlyError } from '@/lib/errors';
import { Avatar } from '@/components/ui/avatar';

type VendorRow = Vendor & { status: 'Active' | 'Inactive'; autoInactive: boolean; empCount: number };

export default function VendorsPage({ embedded = false }: { embedded?: boolean }) {
  const { vendors, isLoading, error, deleteVendor, fetchVendors } = useVendors();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ vendor: Vendor | null; isDeleting: boolean }>({
    vendor: null, isDeleting: false,
  });
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const toggleCol = (id: string) =>
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

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
    const matchSearch = !q ||
      v.name?.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.phoneExtension?.toLowerCase().includes(q) ||
      addressSearchText(v).includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filtersActive = Boolean(searchQuery) || statusFilter !== 'all';

  const totalActive = enriched.filter((v) => v.status === 'Active').length;
  const totalInactive = enriched.filter((v) => v.status === 'Inactive').length;

  const allOnPageSelected = filtered.length > 0 && filtered.every((x) => selectedIds.has(x.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedIds((prev) => { const next = new Set(prev); if (filtered.every((x) => prev.has(x.id))) filtered.forEach((x) => next.delete(x.id)); else filtered.forEach((x) => next.add(x.id)); return next; });
  const selectedRecords: PartnerRecord[] = validVendors.filter((x) => selectedIds.has(x.id));

  const handleExport = () => {
    if (filtered.length === 0) return;
    exportToCsv<VendorRow>('vendors', filtered, [
      { key: 'id', label: 'Vendor ID' },
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'phoneExtension', label: 'Phone Extension' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zip', label: 'ZIP' },
      { key: 'country', label: 'Country' },
      { key: 'status', label: 'Status' },
      { key: 'autoInactive', label: 'Auto Inactive', value: (v) => (v.autoInactive ? 'Yes' : 'No') },
      { key: 'empCount', label: 'Employees' },
      { key: 'createdAt', label: 'Created', value: (v) => formatDate(v.createdAt, { fallback: '' }) },
      { key: 'updatedAt', label: 'Last Updated', value: (v) => formatDate(v.updatedAt, { fallback: '' }) },
    ]);
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
      toast.error('Failed to delete vendor', friendlyError(err));
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns: DataTableColumn<VendorRow>[] = [
    {
      id: 'name',
      header: 'Vendor',
      sortValue: (v) => v.name?.toLowerCase(),
      cell: (vendor) => (
        <div className="flex items-center gap-3">
          <Avatar name={vendor.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{vendor.name}</p>
            {formatAddress(vendor) && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[160px]">{formatAddress(vendor)}</span>
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      hideBelow: 'md',
      sortValue: (v) => v.contactPerson?.toLowerCase(),
      cell: (v) => v.contactPerson || <span className="text-slate-300">—</span>,
    },
    {
      id: 'email',
      header: 'Email',
      hideBelow: 'lg',
      cell: (v) =>
        v.email ? (
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-300" />{v.email}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'phone',
      header: 'Phone',
      hideBelow: 'lg',
      cell: (v) =>
        v.phone ? (
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-300" />{v.phone}{v.phoneExtension ? ` ext. ${v.phoneExtension}` : ''}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'employees',
      header: 'Employees',
      sortValue: (v) => v.empCount,
      cell: (v) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Users className="h-3 w-3" />{v.empCount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (v) => v.status,
      cell: (v) =>
        v.autoInactive ? (
          <span className="group/tip relative inline-block">
            <StatusBadge label="Inactive" tone="danger" />
            <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg group-hover/tip:block">
              All employees are terminated
            </span>
          </span>
        ) : (
          <StatusBadge label={v.status} tone={v.status === 'Active' ? 'success' : 'danger'} />
        ),
    },
  ];

  const columnItems = columns.map((c) => ({ id: c.id, label: typeof c.header === 'string' ? c.header : c.id }));
  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.id));

  return (
    <PageContainer>
      {!embedded && (
      <PageHeader
        icon={Package}
        eyebrow="Partners"
        title="Vendors"
        backHref="/partners?tab=vendors"
        backLabel="Back to Partners"
        description="Manage vendor partnerships and contractor firms placed through them"
        tone="purple"
        actions={
          <>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button
              onClick={() => router.push('/vendors/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add Vendor
            </button>
          </>
        }
      />
      )}

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard label="Total vendors" value={validVendors.length} icon={Package} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={validVendors.length ? `${Math.round((totalActive / validVendors.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={validVendors.length ? `${Math.round((totalInactive / validVendors.length) * 100)}% of total` : undefined} />
      </StatGrid>

      {/* Bulk copy / move */}
      <PartnerBulkBar source="vendors" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      {/* Table card */}
      <div className="surface">
        {/* Toolbar — Search · status filter · Display menu (pinned right) */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, contact, email, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
            />
          </div>
          <FilterSelect
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
          <ColumnToggle columns={columnItems} hidden={hiddenCols} onToggle={toggleCol} className="ml-auto" />
        </div>

        <DataTable<VendorRow>
          columns={visibleColumns}
          data={filtered}
          getRowId={(v) => v.id}
          caption="Vendors"
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
          onRowClick={(v) => router.push(`/vendors/${v.id}?from=${embedded ? 'partners' : 'list'}`)}
          initialSort={{ columnId: 'name', dir: 'asc' }}
          selection={{
            selectedIds,
            allSelected: allOnPageSelected,
            onToggleRow: toggleOne,
            onToggleAll: toggleAll,
          }}
          rowActions={(vendor) => (
            <div className="flex items-center justify-end gap-1">
              <ActionMenu
                items={[
                  { label: 'View', icon: Eye, onClick: () => router.push(`/vendors/${vendor.id}?from=${embedded ? 'partners' : 'list'}`) },
                  { label: 'Edit', icon: Pencil, onClick: () => router.push(`/vendors/${vendor.id}/edit`) },
                  { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ vendor, isDeleting: false }) },
                ]}
              />
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          )}
          empty={{
            icon: Package,
            tone: 'purple',
            title: filtersActive ? 'No vendors match your filters' : 'No vendors yet',
            description: filtersActive
              ? 'Try different keywords or clear filters.'
              : 'Add your first vendor to start tracking partnerships.',
            action:
              !filtersActive ? (
                <button onClick={() => router.push('/vendors/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Add Vendor
                </button>
              ) : undefined,
          }}
        />

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              {filtered.length} of {validVendors.length} vendor{validVendors.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={[VENDOR_IMPORT]}
        title="Import Vendors"
        onImported={(n) => {
          fetchVendors();
          toast.success('Vendors imported', `${n} vendor${n !== 1 ? 's' : ''} added.`);
        }}
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
    </PageContainer>
  );
}
