'use client';

import React, { useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search, Eye,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight, Download
} from 'lucide-react';
import { exportToCsv } from '@/lib/export';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useEndClients } from '@/context/EndClientContext';
import { useEmployees } from '@/context/EmployeeContext';
import { EndClient } from '@/types/endclient';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { PartnerBulkBar, PartnerRecord } from '@/components/dashboard/PartnerBulkBar';

export default function EndClientsPage() {
  const { endClients, isLoading, deleteEndClient } = useEndClients();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ endClient: EndClient | null; isDeleting: boolean }>({
    endClient: null, isDeleting: false,
  });
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getEmpCount = (endClientId: string) =>
    employees.filter((emp) =>
      emp.endClientAssignments?.some((a) => a.clientId === endClientId) ||
      emp.endClientId === endClientId
    ).length;

  const valid = endClients.filter((c) => c && c.id);

  const filtered = valid.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = valid.filter((c) => c.status === 'Active').length;
  const totalInactive = valid.filter((c) => c.status === 'Inactive').length;

  const allOnPageSelected = filtered.length > 0 && filtered.every((x) => selectedIds.has(x.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedIds((prev) => { const next = new Set(prev); if (filtered.every((x) => prev.has(x.id))) filtered.forEach((x) => next.delete(x.id)); else filtered.forEach((x) => next.add(x.id)); return next; });
  const selectedRecords: PartnerRecord[] = valid.filter((x) => selectedIds.has(x.id));

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered as unknown as Record<string, unknown>[];
    exportToCsv('endclients', rows, [
      { key: 'name', label: 'Name' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'employees', label: 'Employees', value: (c) => getEmpCount(c.id as string) },
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
        title="End Clients"
        description="Manage end client organizations and the employees placed with each"
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
            <button
              onClick={() => router.push('/dashboard/endclients/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add End Client
            </button>
          </>
        }
      />

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard label="Total end clients" value={valid.length} icon={Building2} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={valid.length ? `${Math.round((totalActive / valid.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={valid.length ? `${Math.round((totalInactive / valid.length) * 100)}% of total` : undefined} />
      </StatGrid>

      {/* Bulk copy / move */}
      <PartnerBulkBar source="endclients" selected={selectedRecords} onDone={() => setSelectedIds(new Set())} />

      {/* Table card */}
      <div className="surface">
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

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              tone="emerald"
              title={searchQuery ? 'No end clients match your search' : 'No end clients yet'}
              description={searchQuery ? 'Try different keywords or clear filters.' : 'Add your first end client to start tracking relationships.'}
              action={
                !searchQuery ? (
                  <button
                    onClick={() => router.push('/dashboard/endclients/new')}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" /> Add End Client
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
                  {['End Client', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((endClient, idx) => {
                  const empCount = getEmpCount(endClient.id);
                  return (
                    <tr
                      key={endClient.id ?? idx}
                      onClick={() => router.push(`/dashboard/endclients/${endClient.id}`)}
                      className={cn(
                        'group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50',
                        selectedIds.has(endClient.id) && 'bg-brand-50/50'
                      )}
                    >
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${endClient.name}`} checked={selectedIds.has(endClient.id)} onChange={() => toggleOne(endClient.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                            {endClient.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{endClient.name}</p>
                            {endClient.address && (
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[140px]">{endClient.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{endClient.contactPerson || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        {endClient.email
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{endClient.email}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {endClient.phone
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{endClient.phone}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Users className="h-3 w-3" />{empCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {endClient.status === 'Active' ? (
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
                              { label: 'View', icon: Eye, onClick: () => router.push(`/dashboard/endclients/${endClient.id}`) },
                              { label: 'Edit', icon: Pencil, onClick: () => router.push(`/dashboard/endclients/${endClient.id}/edit`) },
                              { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setDeleteState({ endClient, isDeleting: false }) },
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
          <p className="text-xs text-slate-400">{filtered.length} of {valid.length} end client{valid.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

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
    </div>
  );
}
