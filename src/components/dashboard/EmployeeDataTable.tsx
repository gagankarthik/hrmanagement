'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Eye, Edit2, Trash2, Users, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee, EmployeeType } from '@/types/employee';
import { format } from 'date-fns';
import { ActionMenu } from '@/components/ui/action-menu';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { StatusBadge, statusTone } from '@/components/ui/status-badge';

interface Props {
  employees: Employee[];
  onView?: (e: Employee) => void;
  onEdit?: (e: Employee) => void;
  onDelete?: (e: Employee) => void;
  isLoading?: boolean;
}

const typeBadge: Record<EmployeeType, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Contract: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  '1099': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Offshore: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
};

const statusOf = (e: Employee): string => ('status' in e ? (e as { status?: string }).status ?? '' : '');

type StatusFilter = 'all' | 'Active' | 'Terminated';
const STATUS_PILLS: StatusFilter[] = ['all', 'Active', 'Terminated'];

/** localStorage key for persisting which employee columns are hidden. */
const COLS_STORAGE_KEY = 'ob:cols:employees';

/** Columns that may never be hidden (the table's primary anchor column). */
const ALWAYS_VISIBLE = new Set<string>(['name']);

/**
 * ColumnsToggle — self-contained "Columns" dropdown used inline in the toolbar.
 * A button that opens a checkbox popover to show/hide table columns. Closes on
 * click-outside. Kept local to this file so it has zero shared-file dependencies.
 */
function ColumnsToggle({
  columns,
  hidden,
  onToggle,
}: {
  columns: { id: string; label: string }[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} /> Columns
      </button>
      {open && (
        <div
          role="menu"
          className="surface absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Show columns
          </p>
          {columns.map((c) => {
            const locked = ALWAYS_VISIBLE.has(c.id);
            const shown = !hidden.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={shown}
                disabled={locked}
                onClick={() => !locked && onToggle(c.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors',
                  locked ? 'cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {c.label}
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    shown ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                  )}
                >
                  {shown && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EmployeeDataTable({ employees, onView, onEdit, onDelete, isLoading = false }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Pick up a global search from the top-bar (e.g. /dashboard/employees?q=jane)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  // Restore persisted column visibility.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLS_STORAGE_KEY);
      if (raw) setHidden(new Set((JSON.parse(raw) as string[]).filter((id) => !ALWAYS_VISIBLE.has(id))));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleHidden = (id: string) => {
    if (ALWAYS_VISIBLE.has(id)) return;
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let r = employees;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.personalEmail?.toLowerCase().includes(q) ||
        e.state?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      r = r.filter((e) => ('status' in e ? statusOf(e) === statusFilter : statusFilter === 'Active'));
    }
    return r;
  }, [employees, search, statusFilter]);

  const hasFilters = Boolean(search) || statusFilter !== 'all';

  const allColumns: DataTableColumn<Employee>[] = useMemo(() => [
    {
      id: 'name',
      header: 'Employee',
      sortValue: (e) => e.name?.toLowerCase(),
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {emp.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{emp.name}</p>
            {emp.personalEmail && <p className="truncate text-xs text-slate-400">{emp.personalEmail}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (e) => e.type,
      cell: (emp) => (
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', typeBadge[emp.type])}>{emp.type}</span>
      ),
    },
    {
      id: 'position',
      header: 'Position',
      hideBelow: 'md',
      sortValue: (e) => e.position?.toLowerCase(),
      cell: (e) => e.position || <span className="text-slate-300">—</span>,
    },
    {
      id: 'state',
      header: 'Location',
      hideBelow: 'lg',
      sortValue: (e) => e.state?.toLowerCase(),
      cell: (e) => e.state || <span className="text-slate-300">—</span>,
    },
    {
      id: 'hireDate',
      header: 'Hire Date',
      hideBelow: 'sm',
      sortValue: (e) => e.hireDate ?? '',
      cell: (e) => (e.hireDate ? format(new Date(e.hireDate), 'MM/dd/yyyy') : <span className="text-slate-300">—</span>),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (e) => statusOf(e),
      cell: (e) => {
        const s = statusOf(e);
        return s ? <StatusBadge label={s} tone={statusTone(s)} /> : <StatusBadge label="N/A" tone="neutral" showIcon={false} />;
      },
    },
  ], []);

  // The toggle list (uses the header text as the menu label).
  const toggleColumns = useMemo(
    () => allColumns.map((c) => ({ id: c.id, label: typeof c.header === 'string' ? c.header : c.id })),
    [allColumns],
  );

  // Apply column visibility before handing columns to the table.
  const columns = useMemo(
    () => allColumns.filter((c) => !hidden.has(c.id)),
    [allColumns, hidden],
  );

  return (
    <div className="space-y-3 p-3">
      {/* Single-row filter toolbar: Search · status pills · Columns */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {STATUS_PILLS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <ColumnsToggle columns={toggleColumns} hidden={hidden} onToggle={toggleHidden} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <DataTable<Employee>
          columns={columns}
          data={filtered}
          getRowId={(e) => e.id}
          caption="Employees"
          isLoading={isLoading}
          minWidth="min-w-[760px]"
          initialSort={{ columnId: 'name', dir: 'asc' }}
          onRowClick={onView}
          rowActions={(emp) => (
            <ActionMenu
              items={[
                ...(onView ? [{ label: 'View', icon: Eye, onClick: () => onView(emp) }] : []),
                ...(onEdit ? [{ label: 'Edit', icon: Edit2, onClick: () => onEdit(emp) }] : []),
                ...(onDelete ? [{ label: 'Delete', icon: Trash2, onClick: () => onDelete(emp), danger: true, separatorBefore: true }] : []),
              ]}
            />
          )}
          empty={{
            icon: Users,
            tone: 'brand',
            title: hasFilters ? 'No employees match your filters' : 'No employees found',
            description: hasFilters ? 'Try a different search or clear the filters.' : undefined,
          }}
        />
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-400">
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          {hasFilters && ` — filtered from ${employees.length} total`}
        </p>
      )}
    </div>
  );
}
