'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, Check, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/toast';

export type PartnerKind = 'clients' | 'endclients' | 'vendors' | 'subcontractors';

// Maps a partner kind to the employee assignment array + id field it populates.
const ASSIGN: Record<PartnerKind, { arr: string; key: string; legacyId: string }> = {
  clients: { arr: 'clientAssignments', key: 'clientId', legacyId: 'clientId' },
  endclients: { arr: 'endClientAssignments', key: 'clientId', legacyId: 'endClientId' },
  vendors: { arr: 'vendorAssignments', key: 'vendorId', legacyId: 'vendorId' },
  subcontractors: { arr: 'subcontractorAssignments', key: 'subcontractorId', legacyId: 'subcontractorId' },
};

const typeBadge: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

type AssignEntry = Record<string, unknown>;

/**
 * Modal for assigning existing employees to a partner (client / end client /
 * vendor / subcontractor) directly from its detail page. Lists employees not
 * already assigned, supports multi-select + search, and appends the assignment
 * to each chosen employee.
 */
export function AssignEmployeesModal({
  open,
  onClose,
  partnerKind,
  partnerId,
  partnerName,
}: {
  open: boolean;
  onClose: () => void;
  partnerKind: PartnerKind;
  partnerId: string;
  partnerName: string;
}) {
  const { employees, updateEmployee } = useEmployees();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset selection/search each time the modal opens; lock scroll + Escape to close.
  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQuery('');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const map = ASSIGN[partnerKind];

  const isAssigned = (emp: Employee) => {
    const e = emp as unknown as Record<string, unknown>;
    const arr = e[map.arr] as AssignEntry[] | undefined;
    if (arr?.some((a) => a && a[map.key] === partnerId)) return true;
    if (e[map.legacyId] === partnerId) return true;
    return false;
  };

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => !isAssigned(e))
      .filter((e) =>
        !q || [e.name, e.position, e.personalEmail].some((f) => f?.toLowerCase().includes(q)),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, query, partnerId, partnerKind]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleAssign = async () => {
    if (busy || selected.size === 0) return;
    setBusy(true);
    try {
      for (const emp of employees) {
        if (!selected.has(emp.id)) continue;
        const e = emp as unknown as Record<string, unknown>;
        const arr = [...((e[map.arr] as AssignEntry[]) || [])];
        arr.push({ [map.key]: partnerId, startDate: '', endDate: '' });
        await updateEmployee(emp.id, { [map.arr]: arr } as Partial<Employee>);
      }
      toast.success(`Assigned ${selected.size} employee${selected.size === 1 ? '' : 's'} to ${partnerName}`);
      onClose();
    } catch (err) {
      toast.error('Failed to assign employees', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={() => !busy && onClose()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label={`Add employees to ${partnerName}`}
        className="surface relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden p-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <UserPlus className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Add employees</h2>
              <p className="text-xs text-slate-400">Assign existing employees to {partnerName}</p>
            </div>
          </div>
          <button onClick={() => !busy && onClose()} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees…"
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Users className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-medium text-slate-600">
                {query ? 'No matching employees' : 'Everyone is already assigned'}
              </p>
              <p className="text-xs text-slate-400">
                {query ? 'Try a different search.' : 'All employees are already linked to this record.'}
              </p>
            </div>
          ) : (
            candidates.map((emp) => {
              const checked = selected.has(emp.id);
              const status = 'status' in emp ? (emp as { status?: string }).status : undefined;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    checked ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white',
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{emp.name}</span>
                    <span className="block truncate text-xs text-slate-400">{emp.position || emp.personalEmail || '—'}</span>
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', typeBadge[emp.type] || 'bg-slate-100 text-slate-600')}>
                    {emp.type}
                  </span>
                  {status && (
                    <span className={cn('hidden shrink-0 text-[11px] font-medium sm:inline', status === 'Active' ? 'text-emerald-600' : 'text-slate-400')}>
                      {status}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          <span className="text-xs font-medium text-slate-500">
            {selected.size > 0 ? `${selected.size} selected` : `${candidates.length} available`}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => !busy && onClose()} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={busy || selected.size === 0}
              className="btn-primary px-4 py-2 text-sm"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Assigning…' : `Assign${selected.size ? ` ${selected.size}` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
