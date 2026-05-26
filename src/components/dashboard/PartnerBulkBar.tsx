'use client';

import React, { useState } from 'react';
import { Copy, ArrowRightLeft, X, Loader2, ChevronDown, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients } from '@/context/ClientContext';
import { useEndClients } from '@/context/EndClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export type PartnerKind = 'clients' | 'endclients' | 'vendors' | 'subcontractors';

/** Common shape shared by Client / End Client / Vendor / Subcontractor records. */
export interface PartnerRecord {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

type PartnerFormData = Omit<PartnerRecord, 'id'>;

const KIND_LABEL: Record<PartnerKind, string> = {
  clients: 'Clients',
  endclients: 'End Clients',
  vendors: 'Vendors',
  subcontractors: 'Subcontractors',
};

const ALL_KINDS: PartnerKind[] = ['clients', 'endclients', 'vendors', 'subcontractors'];

// How each partner kind maps onto an employee's assignment fields, so a Move can
// carry the assigned employees across to the target list.
const ASSIGN: Record<PartnerKind, { arr: string; key: string; legacyId: string; legacyName?: string }> = {
  clients: { arr: 'clientAssignments', key: 'clientId', legacyId: 'clientId', legacyName: 'client' },
  endclients: { arr: 'endClientAssignments', key: 'clientId', legacyId: 'endClientId' },
  vendors: { arr: 'vendorAssignments', key: 'vendorId', legacyId: 'vendorId', legacyName: 'vendorName' },
  subcontractors: { arr: 'subcontractorAssignments', key: 'subcontractorId', legacyId: 'subcontractorId' },
};

type AssignEntry = Record<string, unknown>;

/**
 * Floating bulk-action bar for the partner list pages. Copy (duplicate, keep
 * originals) or Move (recreate, re-point the assigned employees to the new record,
 * then delete originals) the selected records into another partner list.
 */
export function PartnerBulkBar({
  source,
  selected,
  onDone,
}: {
  source: PartnerKind;
  selected: PartnerRecord[];
  onDone: () => void;
}) {
  const clients = useClients();
  const endclients = useEndClients();
  const vendors = useVendors();
  const subs = useSubcontractors();
  const { employees, updateEmployee } = useEmployees();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [moveTarget, setMoveTarget] = useState<PartnerKind | null>(null);
  const [openMenu, setOpenMenu] = useState<null | 'copy' | 'move'>(null);

  const create: Record<PartnerKind, (d: PartnerFormData) => Promise<{ id: string }>> = {
    clients: clients.createClient,
    endclients: endclients.createEndClient,
    vendors: vendors.createVendor,
    subcontractors: subs.createSubcontractor,
  };
  const remove: Record<PartnerKind, (id: string) => Promise<void>> = {
    clients: clients.deleteClient,
    endclients: endclients.deleteEndClient,
    vendors: vendors.deleteVendor,
    subcontractors: subs.deleteSubcontractor,
  };

  const targets = ALL_KINDS.filter((k) => k !== source);

  const toFormData = (r: PartnerRecord): PartnerFormData => ({
    name: r.name,
    contactPerson: r.contactPerson,
    email: r.email,
    phone: r.phone,
    address: r.address,
    status: r.status,
  });

  const run = async (target: PartnerKind, mode: 'copy' | 'move') => {
    if (busy || selected.length === 0) return;
    setBusy(true);
    try {
      const src = ASSIGN[source];
      const tgt = ASSIGN[target];
      // Accumulated per-employee assignment changes (move only). Keyed by employee id.
      const empUpdates = new Map<string, Record<string, unknown>>();
      const seed = (emp: Employee) => {
        let u = empUpdates.get(emp.id);
        if (!u) {
          const e = emp as unknown as Record<string, unknown>;
          u = {
            [src.arr]: [...(((e[src.arr] as AssignEntry[]) || []))],
            [tgt.arr]: [...(((e[tgt.arr] as AssignEntry[]) || []))],
          };
          empUpdates.set(emp.id, u);
        }
        return u;
      };

      for (const r of selected) {
        const created = await create[target](toFormData(r));
        const newId = created.id;

        if (mode === 'move') {
          for (const emp of employees) {
            const e = emp as unknown as Record<string, unknown>;
            const u = empUpdates.get(emp.id);
            const curArr = ((u ? u[src.arr] : e[src.arr]) as AssignEntry[] | undefined) || [];
            const matches = curArr.filter((a) => a && a[src.key] === r.id);
            const legacyIdMatch = e[src.legacyId] === r.id && r.id !== '';
            const legacyNameMatch =
              !!src.legacyName && !!r.name && e[src.legacyName] === r.name && curArr.length === 0 && !legacyIdMatch;
            if (matches.length === 0 && !legacyIdMatch && !legacyNameMatch) continue;

            const uu = seed(emp);
            const dates = (matches[0] || {}) as { startDate?: string; endDate?: string };
            uu[src.arr] = (uu[src.arr] as AssignEntry[]).filter((a) => !(a && a[src.key] === r.id));
            (uu[tgt.arr] as AssignEntry[]).push({ [tgt.key]: newId, startDate: dates.startDate, endDate: dates.endDate });
            if (legacyIdMatch) uu[src.legacyId] = '';
            if (legacyNameMatch && src.legacyName) uu[src.legacyName] = '';
          }
        }
      }

      if (mode === 'move') {
        for (const [empId, u] of empUpdates) {
          await updateEmployee(empId, u as Partial<Employee>);
        }
        for (const r of selected) {
          await remove[source](r.id);
        }
      }

      const movedEmps = empUpdates.size;
      toast.success(
        `${mode === 'copy' ? 'Copied' : 'Moved'} ${selected.length} ${selected.length === 1 ? 'record' : 'records'} to ${KIND_LABEL[target]}`,
        mode === 'move' && movedEmps > 0 ? `${movedEmps} employee${movedEmps === 1 ? '' : 's'} re-assigned` : undefined,
      );
      onDone();
    } catch (e) {
      toast.error('Bulk action failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
      setMoveTarget(null);
    }
  };

  if (selected.length === 0) return null;

  const renderMenu = (kind: 'copy' | 'move') => {
    const isCopy = kind === 'copy';
    const open = openMenu === kind;
    return (
      <div className="relative">
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpenMenu((m) => (m === kind ? null : kind))}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50',
            isCopy
              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'bg-amber-500 text-white shadow-sm hover:bg-amber-600',
          )}
        >
          {isCopy ? <Copy className="h-3.5 w-3.5" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
          {isCopy ? 'Copy to' : 'Move to'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2} />
        </button>

        {open && (
          <div
            role="menu"
            className="surface absolute right-0 z-30 mt-2 w-52 overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isCopy ? 'Duplicate into' : 'Relocate into'}
            </p>
            {targets.map((t) => (
              <button
                key={t}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  if (isCopy) void run(t, 'copy');
                  else setMoveTarget(t);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                    isCopy ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600',
                  )}
                >
                  {isCopy ? <Copy className="h-3.5 w-3.5" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                </span>
                {KIND_LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="surface flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 ring-1 ring-brand-100 animate-in fade-in slide-in-from-top-1 duration-150">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/10 text-brand-700">
            <CheckSquare className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">{selected.length}</span>
          selected
          <span className="hidden text-xs font-normal text-slate-400 sm:inline">in {KIND_LABEL[source]}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Click-away layer for the open dropdown */}
          {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} aria-hidden />}
          {renderMenu('copy')}
          {renderMenu('move')}
          <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" />
          <button
            type="button"
            onClick={onDone}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            {busy ? 'Working…' : 'Clear'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={moveTarget !== null}
        onClose={() => !busy && setMoveTarget(null)}
        onConfirm={() => { if (moveTarget) void run(moveTarget, 'move'); }}
        title={`Move ${selected.length} to ${moveTarget ? KIND_LABEL[moveTarget] : ''}`}
        description={
          <>
            This recreates {selected.length === 1 ? 'this record' : `these ${selected.length} records`} under{' '}
            <span className="font-semibold text-slate-900">{moveTarget ? KIND_LABEL[moveTarget] : ''}</span>, moves their assigned employees across, and removes {selected.length === 1 ? 'it' : 'them'} from {KIND_LABEL[source]}.
          </>
        }
        confirmLabel="Move"
        isLoading={busy}
      />
    </>
  );
}
