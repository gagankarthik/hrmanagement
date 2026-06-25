'use client';

import React, { useState, useMemo } from 'react';
import {
  UserCheck, Plus, Eye, Pencil, Trash2, Users, Search,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download, Upload
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Subcontractor } from '@/types/subcontractor';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { exportToCsv } from '@/lib/export';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { SUBCONTRACTOR_IMPORT } from '@/lib/bulk-import/configs';

type SubcontractorRow = Subcontractor & { status: 'Active' | 'Inactive'; autoInactive: boolean; empCount: number };

export default function SubcontractorsPage({ embedded = false }: { embedded?: boolean }) {
  const { subcontractors, isLoading, deleteSubcontractor, fetchSubcontractors } = useSubcontractors();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ subcontractor: Subcontractor | null; isDeleting: boolean }>({
    subcontractor: null, isDeleting: false,
  });
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);

  const getSubconEmps = (subcontractorId: string) =>
    employees.filter((emp) =>
      emp.subcontractorAssignments?.some((a) => a.subcontractorId === subcontractorId) ||
      emp.subcontractorId === subcontractorId
    );

  const getEffectiveStatus = (subcontractor: Subcontractor): { status: 'Active' | 'Inactive'; autoInactive: boolean } => {
    const emps = getSubconEmps(subcontractor.id);
    const allTerminated = emps.length > 0 && emps.every((e) => 'status' in e && e.status === 'Terminated');
    return { status: allTerminated ? 'Inactive' : subcontractor.status, autoInactive: allTerminated };
  };

  const validSubcontractors = useMemo(() => subcontractors.filter((s) => s && s.id), [subcontractors]);

  const enriched: SubcontractorRow[] = useMemo(
    () => validSubcontractors.map((s) => ({ ...s, ...getEffectiveStatus(s), empCount: getSubconEmps(s.id).length })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validSubcontractors, employees],
  );

  const rows = useMemo(
    () =>
      enriched.filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.contactPerson?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [enriched, searchQuery, statusFilter],
  );

  const totalActive = enriched.filter((s) => s.status === 'Active').length;
  const totalInactive = enriched.filter((s) => s.status === 'Inactive').length;

  const allOnPageSelected = rows.length > 0 && rows.every((x) => selectedIds.has(x.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedIds((prev) => { const next = new Set(prev); if (rows.every((x) => prev.has(x.id))) rows.forEach((x) => next.delete(x.id)); else rows.forEach((x) => next.add(x.id)); return next; });
  const selectedRecords: PartnerRecord[] = validSubcontractors.filter((x) => selectedIds.has(x.id));

  const handleExport = () => {
    if (rows.length === 0) return;
    exportToCsv('subcontractors', rows as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'empCount', label: 'Employees' },
    ]);
  };

  const confirmDelete = async () => {
    const subcontractor = deleteState.subcontractor;
    if (!subcontractor) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteSubcontractor(subcontractor.id);
      toast.success('Subcontractor deleted', `${subcontractor.name} has been removed.`);
      setDeleteState({ subcontractor: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete subcontractor', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns: DataTableColumn<SubcontractorRow>[] = [
    {
      id: 'name',
      header: 'Subcontractor',
      sortValue: (s) => s.name?.toLowerCase(),
      cell: (subcontractor) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700">
            {subcontractor.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{subcontractor.name}</p>
            {subcontractor.address && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[160px]">{subcontractor.address}</span>
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
      sortValue: (s) => s.contactPerson?.toLowerCase(),
      cell: (s) => s.contactPerson || <span className="text-slate-300">—</span>,
    },
    {
      id: 'email',
      header: 'Email',
      hideBelow: 'lg',
      cell: (s) =>
        s.email ? (
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-300" />{s.email}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'phone',
      header: 'Phone',
      hideBelow: 'lg',
      cell: (s) =>
        s.phone ? (
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-300" />{s.phone}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'employees',
      header: 'Employees',
      sortValue: (s) => s.empCount,
      cell: (s) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Users className="h-3 w-3" />{s.empCount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (s) => s.status,
      cell: (s) =>
        s.autoInactive ? (
          <span className="group/tip relative inline-block">
            <StatusBadge label="Inactive" tone="danger" />
            <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg group-hover/tip:block">
              All assigned employees are terminated
            </span>
          </span>
        ) : (
          <StatusBadge label={s.status} tone={s.status === 'Active' ? 'success' : 'danger'} />
        ),
    },
  ];

  return (
    <PageContainer>
      {!embedded && (
      <PageHeader
        icon={UserCheck}
        eyebrow="Partners"
        title="Subcontractors"
        description="Manage subcontractor firms and the employees assigned to them"
        tone="teal"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={rows.length === 0} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button onClick={() => router.push('/dashboard/subcontractors/new')} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Subcontractor
            </button>
          </div>
        }
      />
      )}

      <StatGrid cols={3}>
        <StatCard label="Total subcontractors" value={validSubcontractors.length} icon={UserCheck} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={validSubcontractors.length ? `${Math.round((totalActive / validSubcontractors.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={validSubcontractors.length ? `${Math.round((totalInactive / validSubcontractors.length) * 100)}% of total` : undefined} />
      </StatGrid>

      <PartnerBulkBar source="subcontractors" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      <div className="surface">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subcontractors..."
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

        <DataTable<SubcontractorRow>
          columns={columns}
          data={rows}
          getRowId={(s) => s.id}
          caption="Subcontractors"
          tableId="subcontractors"
          isLoading={isLoading}
          onRowClick={(s) => router.push(`/dashboard/subcontractors/${s.id}`)}
          initialSort={{ columnId: 'name', dir: 'asc' }}
          selection={{ selectedIds, allSelected: allOnPageSelected, onToggleRow: toggleOne, onToggleAll: toggleAll }}
          rowActions={(subcontractor) => (
            <div className="flex items-center justify-end gap-1">
              <ActionMenu
                items={[
                  { label: 'View', icon: Eye, onClick: () => router.push(`/dashboard/subcontractors/${subcontractor.id}`) },
                  { label: 'Edit', icon: Pencil, onClick: () => router.push(`/dashboard/subcontractors/${subcontractor.id}/edit`) },
                  { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ subcontractor, isDeleting: false }) },
                ] satisfies ActionMenuItem[]}
              />
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          )}
          empty={{
            icon: UserCheck,
            tone: 'default',
            title: searchQuery || statusFilter !== 'all' ? 'No subcontractors match your filters' : 'No subcontractors yet',
            description:
              searchQuery || statusFilter !== 'all'
                ? 'Try different keywords or clear filters.'
                : 'Add your first subcontractor to start assigning employees.',
            action:
              !searchQuery && statusFilter === 'all' ? (
                <button onClick={() => router.push('/dashboard/subcontractors/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Add Subcontractor
                </button>
              ) : undefined,
          }}
        />

        {!isLoading && rows.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              {rows.length} of {validSubcontractors.length} subcontractor{validSubcontractors.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={[SUBCONTRACTOR_IMPORT]}
        title="Import Subcontractors"
        onImported={(n) => {
          fetchSubcontractors();
          toast.success('Subcontractors imported', `${n} subcontractor${n !== 1 ? 's' : ''} added.`);
        }}
      />

      <ConfirmDialog
        isOpen={deleteState.subcontractor !== null}
        onClose={() => setDeleteState({ subcontractor: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Subcontractor"
        description={
          deleteState.subcontractor ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.subcontractor.name}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Subcontractor"
        isLoading={deleteState.isDeleting}
      />
    </PageContainer>
  );
}
