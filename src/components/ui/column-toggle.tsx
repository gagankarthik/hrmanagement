'use client';

import * as React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnToggleItem {
  /** Stable column id (must match the DataTable column id). */
  id: string;
  /** Human label shown in the menu. */
  label: string;
}

/**
 * ColumnToggle — a reusable "Columns" dropdown that shows/hides table columns.
 *
 * Controlled: the parent owns the `hidden` set and filters its columns before
 * passing them to the table. A button labeled "Columns" (with a
 * SlidersHorizontal icon) opens a popover listing each column with a checkbox.
 * Closes on outside click or Escape. Styling mirrors the DataTable internal
 * column menu so every list page looks identical.
 */
export function ColumnToggle({
  columns,
  hidden,
  onToggle,
  className,
}: {
  columns: ColumnToggleItem[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const shownCount = columns.length - columns.filter((c) => hidden.has(c.id)).length;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
        Columns
        <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">
          {shownCount}/{columns.length}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="surface absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Show columns
          </p>
          {columns.map((c) => {
            const shown = !hidden.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={shown}
                onClick={() => onToggle(c.id)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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
