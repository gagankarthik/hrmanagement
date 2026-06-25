'use client';

import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, RefreshCw, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * DataTable — a single, accessible, responsive table used across every list page
 * (employees, clients, vendors, end clients, subcontractors, …). It owns the
 * four interaction states (loading / error / empty / data), optional client-side
 * sorting, row selection, per-row actions, keyboard-activatable rows, and
 * per-user column visibility (saved per `tableId`) — so a page only declares its
 * columns and data instead of re-implementing markup.
 */

export type SortDir = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Stable unique id for the column. */
  id: string;
  header: React.ReactNode;
  /** Cell renderer for a row. */
  cell: (row: T) => React.ReactNode;
  /** Provide to enable sorting on this column. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  /** Hide this column below the given breakpoint (keeps tables readable on mobile). */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Tailwind width utility for the column, e.g. 'w-10'. */
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  /** Short label for the column-visibility menu (defaults to `header` if a string). */
  menuLabel?: string;
  /** Allow the user to hide this column (requires `tableId`). */
  hideable?: boolean;
}

export interface DataTableSelection {
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Stable row identity (used for keys, selection, sort stability). */
  getRowId: (row: T) => string;
  /** Accessible table description (visually hidden). */
  caption: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  /** Empty-state config shown when there is no data and not loading. */
  empty?: {
    icon?: React.ElementType;
    title: string;
    description?: string;
    action?: React.ReactNode;
    tone?: React.ComponentProps<typeof EmptyState>['tone'];
  };
  selection?: DataTableSelection;
  /** Trailing per-row actions cell (e.g. an ActionMenu). */
  rowActions?: (row: T) => React.ReactNode;
  /** Min width before horizontal scroll kicks in. */
  minWidth?: string;
  stickyHeader?: boolean;
  initialSort?: { columnId: string; dir: SortDir };
  /** When set, enables a persisted column-visibility menu (key: ob:cols:<tableId>). */
  tableId?: string;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;
const hideClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

function colLabel<T>(c: DataTableColumn<T>): string {
  return c.menuLabel ?? (typeof c.header === 'string' ? c.header : c.id);
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  empty,
  selection,
  rowActions,
  minWidth = 'min-w-[720px]',
  stickyHeader = false,
  initialSort,
  tableId,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ columnId: string; dir: SortDir } | null>(initialSort ?? null);

  // ── Column visibility (persisted per tableId) ──────────────────────────
  // A column is toggleable when explicitly `hideable`, or (by default) when it
  // already collapses responsively via `hideBelow` — i.e. the secondary columns.
  const hideableCols = React.useMemo(
    () => columns.filter((c) => c.hideable ?? Boolean(c.hideBelow)),
    [columns],
  );
  const storageKey = tableId ? `ob:cols:${tableId}` : null;
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = React.useState(false);
  const colMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
  }, [storageKey]);

  React.useEffect(() => {
    if (!colMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [colMenuOpen]);

  const toggleHidden = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ } }
      return next;
    });
  };

  const visibleColumns = React.useMemo(
    () => columns.filter((c) => !hidden.has(c.id)),
    [columns, hidden],
  );

  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col?.sortValue) return data;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return data
      .map((row, i) => ({ row, i }))
      .sort((a, b) => {
        const av = col.sortValue!(a.row);
        const bv = col.sortValue!(b.row);
        if (av == null && bv == null) return a.i - b.i;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return a.i - b.i;
      })
      .map((d) => d.row);
  }, [data, sort, columns]);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.columnId === col.id
        ? { columnId: col.id, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { columnId: col.id, dir: 'asc' },
    );
  };

  // ── Error ──────────────────────────────────────────────────────────────
  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-4 ring-white">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-lg font-bold text-slate-900">Couldn&apos;t load this list</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost mt-5">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
      </div>
    );
  }

  // ── Empty (only when not loading) ──────────────────────────────────────
  if (!isLoading && data.length === 0 && empty) {
    return (
      <div className="p-5">
        <EmptyState
          icon={empty.icon}
          tone={empty.tone}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Column-visibility control */}
      {tableId && hideableCols.length > 0 && (
        <div ref={colMenuRef} className="relative flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setColMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={colMenuOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} /> Columns
          </button>
          {colMenuOpen && (
            <div role="menu" className="surface absolute right-3 top-full z-20 mt-1 w-52 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Show columns</p>
              {hideableCols.map((c) => {
                const shown = !hidden.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={shown}
                    onClick={() => toggleHidden(c.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {colLabel(c)}
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded border', shown ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                      {shown && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={cn('w-full border-collapse', minWidth)}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className={cn('border-b border-slate-100 bg-slate-50/60', stickyHeader && 'sticky top-0 z-10')}>
              {selection && (
                <th scope="col" className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selection.allSelected}
                    onChange={selection.onToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-200"
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const active = sort?.columnId === col.id;
                const SortIcon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400',
                      alignClass[col.align ?? 'left'],
                      col.width,
                      col.hideBelow && hideClass[col.hideBelow],
                      col.headerClassName,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
                          active && 'text-slate-700',
                        )}
                      >
                        {col.header}
                        <SortIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th scope="col" className="w-16 px-5 py-3" />}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, r) => (
                  <tr key={`sk-${r}`} className="border-b border-slate-50 last:border-0">
                    {selection && (
                      <td className="px-5 py-3.5">
                        <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn('px-5 py-3.5', col.hideBelow && hideClass[col.hideBelow])}
                      >
                        <div className={cn('h-4 animate-pulse rounded bg-slate-100', r % 2 ? 'w-1/2' : 'w-3/4')} />
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-5 py-3.5">
                        <div className="ml-auto h-4 w-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    )}
                  </tr>
                ))
              : sortedData.map((row) => {
                  const id = getRowId(row);
                  const selected = selection?.selectedIds.has(id) ?? false;
                  const clickable = Boolean(onRowClick);
                  return (
                    <tr
                      key={id}
                      onClick={clickable ? () => onRowClick!(row) : undefined}
                      onKeyDown={
                        clickable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRowClick!(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={clickable ? 0 : undefined}
                      role={clickable ? 'button' : undefined}
                      className={cn(
                        'border-b border-slate-50 transition-colors last:border-0',
                        clickable &&
                          'cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-brand-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200',
                        selected && 'bg-brand-50/50',
                      )}
                    >
                      {selection && (
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={selected}
                            onChange={() => selection.onToggleRow(id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-200"
                          />
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.id}
                          className={cn(
                            'px-5 py-3.5 text-sm text-slate-600',
                            alignClass[col.align ?? 'left'],
                            col.hideBelow && hideClass[col.hideBelow],
                            col.cellClassName,
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end">{rowActions(row)}</div>
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
