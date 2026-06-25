import React from 'react';

/** Read-only list of resolved assignment rows (name + date range) for the review step. */
export function ReviewAssignmentList({ label, rows }: { label: string; rows: { name: string; range: string }[] }) {
  return (
    <div>
      <h4 className="mb-2 font-display text-sm font-bold text-slate-900">{label}</h4>
      <ul className="space-y-2">
        {rows.map((row, idx) => (
          <li
            key={idx}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
          >
            <span className="text-sm font-medium text-slate-800">{row.name}</span>
            <span className="text-xs text-slate-500">{row.range}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
