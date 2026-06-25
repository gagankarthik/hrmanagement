'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search, Eye,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download, Upload
} from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { CLIENT_IMPORT } from '@/lib/bulk-import/configs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { useClients } from '@/context/ClientContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Client } from '@/types/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ColumnToggle } from '@/components/ui/column-toggle';
import { StatusBadge } from '@/components/ui/status-badge';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';

type ClientRow = Client & { empCount: number };

export default function ClientsPage({ embedded = false }: { embedded?: boolean }) {
  const { clients, isLoading, deleteClient, fetchClients } = useClients();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ client: Client | null; isDeleting: boolean }>({
    client: null, isDeleting: false,
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

  const getEmpCount = (clientId: string, clientName: string) =>
    employees.filter((emp) =>
      emp.clientAssignments?.some((a) => a.clientId === clientId) ||
      emp.clientId === clientId ||
      emp.client === clientName
    ).length;

  const valid = useMemo(() => clients.filter((c) => c && c.id), [clients]);

  const rows: ClientRow[] = useMemo(
    () =>
      valid
        .filter((c) => {
          const q = searchQuery.toLowerCase();
          const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
          const matchStatus = statusFilter === 'all' || c.status === statusFilter;
          return matchSearch && matchStatus;
        })
        .map((c) => ({ ...c, empCount: getEmpCount(c.id, c.name) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valid, employees, searchQuery, statusFilter],
  );

  const totalActive = valid.filter((c) => c.status === 'Active').length;
  const totalInactive = valid.filter((c) => c.status === 'Inactive').length;

  const allOnPageSelected = rows.length > 0 && rows.every((c) => selectedIds.has(c.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (rows.every((c) => prev.has(c.id))) rows.forEach((c) => next.delete(c.id));
    else rows.forEach((c) => next.add(c.id));
    return next;
  });
  const selectedRecords: PartnerRecord[] = valid.filter((c) => selectedIds.has(c.id));

  const handleExport = () => {
    if (rows.length === 0) return;
    exportToCsv('clients', rows as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'empCount', label: 'Employees' },
    ]);
  };

  const confirmDelete = async () => {
    const client = deleteState.client;
    if (!client) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteClient(client.id);
      toast.success('Client deleted', `${client.name} has been removed.`);
      setDeleteState({ client: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete client', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns: DataTableColumn<ClientRow>[] = [
    {
      id: 'name',
      header: 'Client',
      sortValue: (c) => c.name?.toLowerCase(),
      cell: (client) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
            {client.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{client.name}</p>
            {client.address && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[160px]">{client.address}</span>
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

  const columnItems = columns.map((c) => ({ id: c.id, label: typeof c.header === 'string' ? c.header : c.id }));
  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.id));

  return (
    <PageContainer>
      {!embedded && (
      <PageHeader
        icon={Building2}
        eyebrow="Partners"
        title="Clients"
        description="Manage client organizations and the employees placed with each"
        tone="emerald"
        actions={
          <>
            <button onClick={handleExport} disabled={rows.length === 0} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button onClick={() => router.push('/clients/new')} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Client
            </button>
          </>
        }
      />
      )}

      <StatGrid cols={3}>
        <StatCard label="Total clients" value={valid.length} icon={Building2} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={valid.length ? `${Math.round((totalActive / valid.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={valid.length ? `${Math.round((totalInactive / valid.length) * 100)}% of total` : undefined} />
      </StatGrid>

      <PartnerBulkBar source="clients" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      <div className="surface">
        {/* Toolbar — Search · All/Active/Inactive · Columns (single row) */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
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
          <ColumnToggle columns={columnItems} hidden={hiddenCols} onToggle={toggleCol} />
        </div>

        <DataTable<ClientRow>
          columns={visibleColumns}
          data={rows}
          getRowId={(c) => c.id}
          caption="Clients"
          isLoading={isLoading}
          onRowClick={(c) => router.push(`/clients/${c.id}`)}
          initialSort={{ columnId: 'name', dir: 'asc' }}
          selection={{ selectedIds, allSelected: allOnPageSelected, onToggleRow: toggleOne, onToggleAll: toggleAll }}
          rowActions={(client) => (
            <div className="flex items-center justify-end gap-1">
              <ActionMenu
                items={[
                  { label: 'View', icon: Eye, onClick: () => router.push(`/clients/${client.id}`) },
                  { label: 'Edit', icon: Pencil, onClick: () => router.push(`/clients/${client.id}/edit`) },
                  { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ client, isDeleting: false }) },
                ]}
              />
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          )}
          empty={{
            icon: Building2,
            tone: 'emerald',
            title: searchQuery || statusFilter !== 'all' ? 'No clients match your filters' : 'No clients yet',
            description:
              searchQuery || statusFilter !== 'all'
                ? 'Try different keywords or clear filters.'
                : 'Add your first client to start tracking relationships.',
            action:
              !searchQuery && statusFilter === 'all' ? (
                <button onClick={() => router.push('/clients/new')} className="btn-primary">
                  <Plus className="h-4 w-4" /> Add Client
                </button>
              ) : undefined,
          }}
        />

        {!isLoading && rows.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">{rows.length} of {valid.length} client{valid.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={[CLIENT_IMPORT]}
        title="Import Clients"
        onImported={(n) => {
          fetchClients();
          toast.success('Clients imported', `${n} client${n !== 1 ? 's' : ''} added.`);
        }}
      />

      <ConfirmDialog
        isOpen={deleteState.client !== null}
        onClose={() => setDeleteState({ client: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Client"
        description={
          deleteState.client ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.client.name}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Client"
        isLoading={deleteState.isDeleting}
      />
    </PageContainer>
  );
}
