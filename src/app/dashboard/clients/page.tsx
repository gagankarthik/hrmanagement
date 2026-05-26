'use client';

import React, { useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search, Eye,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download, Upload
} from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { CLIENT_IMPORT } from '@/lib/bulk-import/configs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useClients } from '@/context/ClientContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Client } from '@/types/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';

export default function ClientsPage() {
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

  const getEmpCount = (clientId: string, clientName: string) =>
    employees.filter((emp) =>
      emp.clientAssignments?.some((a) => a.clientId === clientId) ||
      emp.clientId === clientId ||
      emp.client === clientName
    ).length;

  const valid = clients.filter((c) => c && c.id);

  const filtered = valid.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = valid.filter((c) => c.status === 'Active').length;
  const totalInactive = valid.filter((c) => c.status === 'Inactive').length;

  const allOnPageSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (filtered.every((c) => prev.has(c.id))) filtered.forEach((c) => next.delete(c.id));
    else filtered.forEach((c) => next.add(c.id));
    return next;
  });
  const selectedRecords: PartnerRecord[] = valid.filter((c) => selectedIds.has(c.id));

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered as unknown as Record<string, unknown>[];
    exportToCsv('clients', rows, [
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'employees', label: 'Employees', value: (c) => getEmpCount(c.id as string, c.name as string) },
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
        icon={Building2}
        eyebrow="Partners"
        title="Clients"
        description="Manage client organizations and the employees placed with each"
        tone="emerald"
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
              onClick={() => router.push('/dashboard/clients/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add Client
            </button>
          </>
        }
      />

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard label="Total clients" value={valid.length} icon={Building2} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={valid.length ? `${Math.round((totalActive / valid.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={valid.length ? `${Math.round((totalInactive / valid.length) * 100)}% of total` : undefined} />
      </StatGrid>

      {/* Bulk copy / move */}
      <PartnerBulkBar source="clients" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      {/* Table card */}
      <div className="surface">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
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
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              tone="emerald"
              title={searchQuery ? 'No clients match your search' : 'No clients yet'}
              description={searchQuery ? 'Try different keywords or clear filters.' : 'Add your first client to start tracking relationships.'}
              action={
                !searchQuery ? (
                  <button
                    onClick={() => router.push('/dashboard/clients/new')}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" /> Add Client
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
                  <th className="w-10 px-5 py-3">
                    <input type="checkbox" aria-label="Select all" checked={allOnPageSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
                  </th>
                  {['Client', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, idx) => {
                  const empCount = getEmpCount(client.id, client.name);
                  return (
                    <tr
                      key={client.id ?? idx}
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className={cn(
                        'group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50',
                        selectedIds.has(client.id) && 'bg-brand-50/50'
                      )}
                    >
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${client.name}`} checked={selectedIds.has(client.id)} onChange={() => toggleOne(client.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                            {client.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                            {client.address && (
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[140px]">{client.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{client.contactPerson || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        {client.email
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{client.email}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {client.phone
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{client.phone}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Users className="h-3 w-3" />{empCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {client.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionMenu
                            items={[
                              { label: 'View', icon: Eye, onClick: () => router.push(`/dashboard/clients/${client.id}`) },
                              { label: 'Edit', icon: Pencil, onClick: () => router.push(`/dashboard/clients/${client.id}/edit`) },
                              { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ client, isDeleting: false }) },
                            ]}
                          />
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">{filtered.length} of {valid.length} client{valid.length !== 1 ? 's' : ''}</p>
        </div>
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
    </div>
  );
}
