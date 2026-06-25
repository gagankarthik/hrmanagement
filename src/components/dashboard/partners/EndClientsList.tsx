'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search, Eye,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download, Upload
} from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { ENDCLIENT_IMPORT } from '@/lib/bulk-import/configs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { useEndClients } from '@/context/EndClientContext';
import { useEmployees } from '@/context/EmployeeContext';
import { EndClient } from '@/types/endclient';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';

type EndClientRow = EndClient & { empCount: number };

export default function EndClientsPage({ embedded = false }: { embedded?: boolean }) {
  const { endClients, isLoading, deleteEndClient, fetchEndClients } = useEndClients();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ endClient: EndClient | null; isDeleting: boolean }>({
    endClient: null, isDeleting: false,
  });
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);

  const getEmpCount = (endClientId: string) =>
    employees.filter((emp) =>
      emp.endClientAssignments?.some((a) => a.clientId === endClientId) ||
      emp.endClientId === endClientId
    ).length;

  const valid = useMemo(() => endClients.filter((c) => c && c.id), [endClients]);

  const rows: EndClientRow[] = useMemo(
    () =>
      valid
        .filter((c) => {
          const q = searchQuery.toLowerCase();
          const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
          const matchStatus = statusFilter === 'all' || c.status === statusFilter;
          return matchSearch && matchStatus;
        })
        .map((c) => ({ ...c, empCount: getEmpCount(c.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valid, employees, searchQuery, statusFilter],
  );

  const totalActive = valid.filter((c) => c.status === 'Active').length;
  const totalInactive = valid.filter((c) => c.status === 'Inactive').length;

  const allOnPageSelected = rows.length > 0 && rows.every((x) => selectedIds.has(x.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedIds((prev) => { const next = new Set(prev); if (rows.every((x) => prev.has(x.id))) rows.forEach((x) => next.delete(x.id)); else rows.forEach((x) => next.add(x.id)); return next; });
  const selectedRecords: PartnerRecord[] = valid.filter((x) => selectedIds.has(x.id));

  const handleExport = () => {
    if (rows.length === 0) return;
    exportToCsv('endclients', rows as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'empCount', label: 'Employees' },
    ]);
  };

  const confirmDelete = async () => {
    const endClient = deleteState.endClient;
    if (!endClient) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteEndClient(endClient.id);
      toast.success('End client deleted', `${endClient.name} has been removed.`);
      setDeleteState({ endClient: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete end client', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns: DataTableColumn<EndClientRow>[] = [
    {
      id: 'name',
      header: 'End Client',
      sortValue: (c) => c.name?.toLowerCase(),
      cell: (endClient) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
            {endClient.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{endClient.name}</p>
            {endClient.address && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[160px]">{endClient.address}</span>
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
      sortValue: (c) => c.contactPerson?.toLowerCase(),
      cell: (c) => c.contactPerson || <span className="text-slate-300">—</span>,
    },
    {
      id: 'email',
      header: 'Email',
      hideBelow: 'lg',
      cell: (c) =>
        c.email ? (
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-300" />{c.email}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'phone',
      header: 'Phone',
      hideBelow: 'lg',
      cell: (c) =>
        c.phone ? (
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-300" />{c.phone}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: 'employees',
      header: 'Employees',
      sortValue: (c) => c.empCount,
      cell: (c) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Users className="h-3 w-3" />{c.empCount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (c) => c.status,
      cell: (c) => <StatusBadge label={c.status} tone={c.status === 'Active' ? 'success' : 'danger'} />,
    },
  ];

  return (
    <PageContainer>
      {!embedded && (
      <PageHeader
        icon={Building2}
        eyebrow="Partners"
        title="End Clients"
        description="Manage end client organizations and the employees placed with each"
        tone="emerald"
        actions={
          <>
            <button onClick={handleExport} disabled={rows.length === 0} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button onClick={() => router.push('/dashboard/endclients/new')} className="btn-primary">
              <Plus className="h-4 w-4" /> Add End Client
            </button>
          </>
        }
      />
      )}

      <StatGrid cols={3}>
        <StatCard label="Total end clients" value={valid.length} icon={Building2} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={valid.length ? `${Math.round((totalActive / valid.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={valid.length ? `${Math.round((totalInactive / valid.length) * 100)}% of total` : undefined} />
      </StatGrid>

      <PartnerBulkBar source="endclients" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      <div className="surface">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search end clients..."
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

        <DataTable<EndClientRow>
          columns={columns}
          data={rows}
          getRowId={(c) => c.id}
          caption="End clients"
          tableId="endclients"
          isLoading={isLoading}
          onRowClick={(c) => router.push(`/dashboard/endclients/${c.id}`)}
          initialSort={{ columnId: 'name', dir: 'asc' }}
          selection={{ selectedIds, allSelected: allOnPageSelected, onToggleRow: toggleOne, onToggleAll: toggleAll }}
          rowActions={(endClient) => (
            <div className="flex items-center justify-end gap-1">
              <ActionMenu
                items={[
                  { label: 'View', icon: Eye, onClick: () => router.push(`/dashboard/endclients/${endClient.id}`) },
                  { label: 'Edit', icon: Pencil, onClick: () => router.push(`/dashboard/endclients/${endClient.id}/edit`) },
                  { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ endClient, isDeleting: false }) },
                ]}
              />
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          )}
          empty={{
            icon: Building2,
            tone: 'emerald',
            title: searchQuery || statusFilter !== 'all' ? 'No end clients match your filters' : 'No end clients yet',
            description:
              searchQuery || statusFilter !== 'all'
                ? 'Try different keywords or clear filters.'
                : 'Add your first end client to start tracking relationships.',
            action:
              !searchQuery && statusFilter === 'all' ? (
                <button onClick={() => router.push('/dashboard/endclients/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Add End Client
                </button>
              ) : undefined,
          }}
        />

        {!isLoading && rows.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">{rows.length} of {valid.length} end client{valid.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={[ENDCLIENT_IMPORT]}
        title="Import End Clients"
        onImported={(n) => {
          fetchEndClients();
          toast.success('End clients imported', `${n} end client${n !== 1 ? 's' : ''} added.`);
        }}
      />

      <ConfirmDialog
        isOpen={deleteState.endClient !== null}
        onClose={() => setDeleteState({ endClient: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete End Client"
        description={
          deleteState.endClient ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.endClient.name}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete End Client"
        isLoading={deleteState.isDeleting}
      />
    </PageContainer>
  );
}
