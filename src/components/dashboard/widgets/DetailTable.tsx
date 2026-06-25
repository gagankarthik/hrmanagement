'use client';

import * as React from 'react';
import Link from 'next/link';
import { Download, FileText, ChevronRight } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { exportToCsv } from '@/lib/export';
import { printTablePdf } from '@/lib/print-table';

/**
 * Tier-3 dashboard detail table — a recent slice of a dataset rendered through
 * the shared DataTable<T> (sortable, responsive), inside a card with CSV + PDF
 * export and a "View all" link to the full list page. A single `serialize`
 * config drives both export formats so they always match the visible table.
 */
export interface DetailTableSerialize<T> {
  headers: string[];
  row: (r: T) => (string | number)[];
}

export interface DashboardDetailTableProps<T> {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  caption: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  initialSort?: { columnId: string; dir: 'asc' | 'desc' };
  empty?: { icon?: React.ElementType; title: string; description?: string };
  /** Max rows shown on the dashboard (the full set lives behind "View all"). */
  maxRows?: number;
  viewAllHref?: string;
  exportName: string;
  serialize: DetailTableSerialize<T>;
}

function ExportButton({ onClick, icon: Icon, label, disabled }: { onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

export function DashboardDetailTable<T>({
  title, subtitle, icon: Icon, columns, data, getRowId, caption,
  isLoading, onRowClick, initialSort, empty, maxRows = 15, viewAllHref, exportName, serialize,
}: DashboardDetailTableProps<T>) {
  const rows = React.useMemo(() => (maxRows ? data.slice(0, maxRows) : data), [data, maxRows]);

  const handleCsv = () => {
    const csvRows = rows.map((r) => {
      const cells = serialize.row(r);
      const o: Record<string, unknown> = {};
      serialize.headers.forEach((h, i) => { o[h] = cells[i]; });
      return o;
    });
    exportToCsv(exportName, csvRows, serialize.headers.map((h) => ({ key: h, label: h })));
  };

  const handlePdf = () => {
    printTablePdf(title, subtitle ?? '', serialize.headers, rows.map((r) => serialize.row(r)));
  };

  return (
    <section className="surface flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ExportButton onClick={handleCsv} icon={Download} label="CSV" disabled={rows.length === 0} />
          <ExportButton onClick={handlePdf} icon={FileText} label="PDF" disabled={rows.length === 0} />
          {viewAllHref && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50">
              View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
      <div className="p-5 pt-3">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={getRowId}
          caption={caption}
          isLoading={isLoading}
          onRowClick={onRowClick}
          initialSort={initialSort}
          empty={empty ? { ...empty } : { title: 'Nothing to show yet' }}
        />
      </div>
    </section>
  );
}
