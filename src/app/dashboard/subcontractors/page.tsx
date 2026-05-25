'use client';

import React, { useState, useMemo } from 'react';
import {
  UserCheck, Plus, Pencil, Trash2, Users, Search,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight
} from 'lucide-react';
import SubcontractorModal from '@/components/dashboard/SubcontractorModal';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Subcontractor } from '@/types/subcontractor';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

export default function SubcontractorsPage() {
  const { subcontractors, isLoading, deleteSubcontractor } = useSubcontractors();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; subcontractor?: Subcontractor }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ subcontractor: Subcontractor | null; isDeleting: boolean }>({
    subcontractor: null, isDeleting: false,
  });
  const toast = useToast();

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

  const validSubcontractors = subcontractors.filter((s) => s && s.id);

  const enriched = useMemo(() =>
    validSubcontractors.map((s) => ({ ...s, ...getEffectiveStatus(s), empCount: getSubconEmps(s.id).length })),
    [validSubcontractors, employees]
  );

  const filtered = enriched.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.contactPerson?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = enriched.filter((s) => s.status === 'Active').length;
  const totalInactive = enriched.filter((s) => s.status === 'Inactive').length;

  const handleDelete = (e: React.MouseEvent, subcontractor: Subcontractor) => {
    e.stopPropagation();
    setDeleteState({ subcontractor, isDeleting: false });
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
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-100 sm:h-12 sm:w-12">
            <UserCheck className="h-5 w-5 text-teal-600 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Subcontractors</h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Manage subcontractor firms and the employees assigned to them
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" /> Add Subcontractor
        </button>
      </header>

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard label="Total subcontractors" value={validSubcontractors.length} icon={UserCheck} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={validSubcontractors.length ? `${Math.round((totalActive / validSubcontractors.length) * 100)}% of total` : undefined} />
        <StatCard label="Inactive" value={totalInactive} icon={XCircle} tone="red" hint={validSubcontractors.length ? `${Math.round((totalInactive / validSubcontractors.length) * 100)}% of total` : undefined} />
      </StatGrid>

      {/* Table card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subcontractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              icon={UserCheck}
              tone="default"
              title={searchQuery ? 'No subcontractors match your search' : 'No subcontractors yet'}
              description={searchQuery ? 'Try different keywords or clear filters.' : 'Add your first subcontractor to start assigning employees.'}
              action={
                !searchQuery ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:shadow-md transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Subcontractor
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
                  {['Subcontractor', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((subcontractor, idx) => (
                  <tr
                    key={subcontractor.id ?? idx}
                    onClick={() => router.push(`/dashboard/subcontractors/${subcontractor.id}`)}
                    className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700">
                          {subcontractor.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{subcontractor.name}</p>
                          {subcontractor.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{subcontractor.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{subcontractor.contactPerson || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      {subcontractor.email
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{subcontractor.email}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {subcontractor.phone
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{subcontractor.phone}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <Users className="h-3 w-3" />{subcontractor.empCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Status with tooltip when auto-inactive */}
                      <div className="relative w-fit">
                        {subcontractor.autoInactive ? (
                          <div className="group/tip relative">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 cursor-default">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-20">
                              <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
                                All assigned employees are terminated
                              </div>
                              <div className="ml-2.5 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                            </div>
                          </div>
                        ) : subcontractor.status === 'Active' ? (
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
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModalState({ isOpen: true, mode: 'edit', subcontractor })}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, subcontractor)}
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
            {filtered.length} of {validSubcontractors.length} subcontractor{validSubcontractors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <SubcontractorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        subcontractor={modalState.subcontractor}
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
    </div>
  );
}
