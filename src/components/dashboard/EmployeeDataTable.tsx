'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Eye, Edit2, Trash2, Users, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee, EmployeeType, EMPLOYEE_TYPES } from '@/types/employee';
import {
  getColumnsByType,
  ALL_TYPES_COLUMNS,
  type TableColumn,
} from '@/features/employees/domain/employee.columns';
import { formatDate, money } from '@/lib/format';
import { ActionMenu } from '@/components/ui/action-menu';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { FilterSelect } from '@/components/ui/filter-select';
import { StatusBadge, statusTone } from '@/components/ui/status-badge';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';

interface Props {
  employees: Employee[];
  onView?: (e: Employee) => void;
  onEdit?: (e: Employee) => void;
  onDelete?: (e: Employee) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const typeBadge: Record<EmployeeType, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Contract: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  '1099': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Offshore: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
};

const statusOf = (e: Employee): string => ('status' in e ? (e as { status?: string }).status ?? '' : '');

type StatusFilter = 'all' | 'Active' | 'Terminated';
type TypeTab = 'all' | EmployeeType;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Terminated', label: 'Terminated' },
];

/** localStorage key for persisting which employee columns are hidden. */
const COLS_STORAGE_KEY = 'ob:cols:employees';

/** Columns that may never be hidden (the table's primary anchor column). */
const ALWAYS_VISIBLE = new Set<string>(['name']);

const dash = <span className="text-slate-300">—</span>;
const textCell = (v: string | undefined) => (v ? v : dash);

/* ── Cell renderers / sort values / responsive collapse, keyed by column key.
     The per-type column CONFIGS live in the employee domain
     (features/employees/domain/employee.columns.ts); this maps each key to
     its presentation so any type's column list can be rendered. ── */

const CELLS: Record<string, (e: Employee) => React.ReactNode> = {
  name: (emp) => (
    <div className="flex items-center gap-3">
      <Avatar name={emp.name} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{emp.name}</p>
        {emp.personalEmail && <p className="truncate text-xs text-slate-500">{emp.personalEmail}</p>}
      </div>
    </div>
  ),
  type: (emp) => (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', typeBadge[emp.type])}>{emp.type}</span>
  ),
  hireDate: (e) => (e.hireDate ? formatDate(e.hireDate) : dash),
  status: (e) => {
    const s = statusOf(e);
    return s ? <StatusBadge label={s} tone={statusTone(s)} /> : <StatusBadge label="N/A" tone="neutral" showIcon={false} />;
  },
  officeEmail: (e) => textCell('officeEmail' in e ? e.officeEmail : undefined),
  personalEmail: (e) => textCell(e.personalEmail),
  workAuthorization: (e) => textCell('workAuthorization' in e ? e.workAuthorization : undefined),
  contractorName: (e) => textCell('contractorName' in e ? e.contractorName : undefined),
  employmentType: (e) => textCell('employmentType' in e ? e.employmentType : undefined),
  client: (e) => textCell(e.client),
  pay: (e) => ('pay' in e && e.pay != null ? money(e.pay) : dash),
  salary: (e) => ('salary' in e && e.salary != null ? money(e.salary) : dash),
};

const SORTERS: Record<string, (e: Employee) => string | number | null | undefined> = {
  name: (e) => e.name?.toLowerCase(),
  type: (e) => e.type,
  position: (e) => e.position?.toLowerCase(),
  state: (e) => e.state?.toLowerCase(),
  city: (e) => e.city?.toLowerCase(),
  hireDate: (e) => e.hireDate ?? '',
  status: (e) => statusOf(e),
  workAuthorization: (e) => ('workAuthorization' in e ? e.workAuthorization?.toLowerCase() : ''),
  contractorName: (e) => ('contractorName' in e ? e.contractorName?.toLowerCase() : ''),
  employmentType: (e) => ('employmentType' in e ? e.employmentType : ''),
  client: (e) => e.client?.toLowerCase(),
  pay: (e) => ('pay' in e ? e.pay ?? null : null),
  salary: (e) => ('salary' in e ? e.salary ?? null : null),
};

/** Which breakpoint (if any) a column collapses below, to keep tables readable on mobile. */
const HIDE_BELOW: Record<string, 'sm' | 'md' | 'lg' | undefined> = {
  position: 'md',
  state: 'lg',
  city: 'lg',
  hireDate: 'sm',
  officeEmail: 'lg',
  personalEmail: 'lg',
  workAuthorization: 'md',
  contractorName: 'md',
  employmentType: 'lg',
  client: 'lg',
  pay: 'md',
  salary: 'md',
};

/** Turn a domain column config into a rendered DataTable column. */
function buildColumn(col: TableColumn): DataTableColumn<Employee> {
  return {
    id: col.key,
    header: col.label,
    sortValue: col.sortable ? SORTERS[col.key] : undefined,
    cell: CELLS[col.key] ?? ((e) => textCell((e as unknown as Record<string, string | undefined>)[col.key])),
    hideBelow: HIDE_BELOW[col.key],
    width: col.width,
  };
}

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
        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-dashed border-[var(--adm-line-strong)] bg-transparent px-2.5 text-[13px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} /> Columns
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-white p-1 shadow-[var(--adm-shadow-pop)] animate-in fade-in zoom-in-95 duration-100"
        >
          <p className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
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
                  'flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13.5px] font-medium transition-colors',
                  locked ? 'cursor-not-allowed text-slate-400' : 'text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)]',
                )}
              >
                {c.label}
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-[4px] border',
                    shown ? 'border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white' : 'border-[var(--adm-line-strong)]',
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

const isEmployeeType = (v: string | null): v is EmployeeType =>
  v != null && EMPLOYEE_TYPES.some((t) => t.value === v);

export default function EmployeeDataTable({ employees, onView, onEdit, onDelete, isLoading = false, error = null, onRetry }: Props) {
  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Pick up a global search and/or a type deep-link (e.g. /employees?type=W2&q=jane)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearch(q);
    const t = params.get('type');
    if (isEmployeeType(t)) setTypeTab(t);
  }, []);

  // Keep the type in the URL so per-type views stay shareable/bookmarkable.
  const selectTab = (t: TypeTab) => {
    setTypeTab(t);
    const url = new URL(window.location.href);
    if (t === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', t);
    window.history.replaceState(null, '', url.toString());
  };

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

  // Type tabs with live counts (counts ignore the search/status filters, so
  // they always describe the whole workforce).
  const typeTabs = useMemo<TabItem<TypeTab>[]>(() => [
    { value: 'all', label: 'All', count: employees.length },
    ...EMPLOYEE_TYPES.map((t) => ({
      value: t.value as TypeTab,
      label: t.label,
      count: employees.filter((e) => e.type === t.value).length,
      dotColor: t.dotColor,
    })),
  ], [employees]);

  const filtered = useMemo(() => {
    let r = employees;
    if (typeTab !== 'all') {
      r = r.filter((e) => e.type === typeTab);
    }
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
  }, [employees, search, typeTab, statusFilter]);

  const hasFilters = Boolean(search) || statusFilter !== 'all';

  // The active tab decides the column set: the combined view shows the shared
  // columns (with Type), each type view shows the columns that matter for it —
  // W2 work auth + pay, Contract contractor, Offshore salary + payroll, etc.
  const allColumns: DataTableColumn<Employee>[] = useMemo(() => {
    const config = typeTab === 'all' ? ALL_TYPES_COLUMNS : getColumnsByType(typeTab);
    return config.map(buildColumn);
  }, [typeTab]);

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

  const tabLabel = typeTab === 'all' ? '' : `${typeTab} `;

  return (
    <div className="space-y-3 p-3">
      {/* Workforce type tabs — each type gets its own columns */}
      <Tabs
        items={typeTabs}
        value={typeTab}
        onChange={selectTab}
        ariaLabel="Employee type"
      />

      {/* Single-row filter toolbar: Search · status · Columns */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] py-1.5 pl-9 pr-3 text-[13px] text-[var(--adm-ink)] outline-none transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Filter by status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <ColumnsToggle columns={toggleColumns} hidden={hidden} onToggle={toggleHidden} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--adm-line)]">
        <DataTable<Employee>
          columns={columns}
          data={filtered}
          getRowId={(e) => e.id}
          caption={typeTab === 'all' ? 'Employees' : `${typeTab} employees`}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
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
            title: hasFilters
              ? `No ${tabLabel}employees match your filters`
              : `No ${tabLabel}employees found`,
            description: hasFilters ? 'Try a different search or clear the filters.' : undefined,
          }}
        />
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">
          {filtered.length} {tabLabel}employee{filtered.length !== 1 ? 's' : ''}
          {hasFilters && ` — filtered from ${employees.length} total`}
        </p>
      )}
    </div>
  );
}
