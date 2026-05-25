'use client';

import React, { useMemo, useState } from 'react';
import { Search, X, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';

/**
 * Searchable multi-select of employees → string[] of employee ids.
 * Selected employees render as removable chips above a filterable checklist.
 */
export function EmployeeMultiSelect({
  value,
  onChange,
  label,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const { employees } = useEmployees();
  const [q, setQ] = useState('');

  const selected = useMemo(
    () => value.map((id) => employees.find((e) => e.id === id)).filter(Boolean) as typeof employees,
    [value, employees],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees
      .filter((e) => !term || e.name?.toLowerCase().includes(term) || e.position?.toLowerCase().includes(term))
      .slice(0, 50);
  }, [q, employees]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>}

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((e) => (
            <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-700">
              {e.name}
              <button
                type="button"
                onClick={() => toggle(e.id)}
                className="rounded-full p-0.5 transition-colors hover:bg-brand-100"
                aria-label={`Remove ${e.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="relative border-b border-slate-100">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employees…"
            className="w-full bg-transparent py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">No employees found</p>
          ) : (
            filtered.map((e) => {
              const on = value.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                    on ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                    )}
                  >
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{e.name}</span>
                    <span className="block truncate text-xs text-slate-400">{e.position || e.type}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
        <Users className="h-3 w-3" /> {value.length} enrolled
      </p>
    </div>
  );
}
