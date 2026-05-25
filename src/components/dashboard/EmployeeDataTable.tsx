'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee, EmployeeType } from '@/types/employee';
import { format } from 'date-fns';
import { SkeletonTable } from '@/components/ui/skeleton';
import { ActionMenu } from '@/components/ui/action-menu';

interface Props {
  employees: Employee[];
  onView?: (e: Employee) => void;
  onEdit?: (e: Employee) => void;
  onDelete?: (e: Employee) => void;
  isLoading?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

const typeBadge: Record<EmployeeType, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Contract: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  '1099': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Offshore: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
};

const statusBadge = {
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Terminated: 'bg-red-50 text-red-600 ring-1 ring-red-200',
};

export default function EmployeeDataTable({ employees, onView, onEdit, onDelete, isLoading = false }: Props) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<EmployeeType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Terminated' | 'all'>('all');

  // Pick up a global search from the top-bar (e.g. /dashboard/employees?q=jane)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  const filtered = useMemo(() => {
    let r = [...employees];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((e) => e.name?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q) || e.personalEmail?.toLowerCase().includes(q) || e.state?.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') r = r.filter((e) => e.type === typeFilter);
    if (statusFilter !== 'all') r = r.filter((e) => 'status' in e ? e.status === statusFilter : statusFilter === 'Active');
    if (sort.key && sort.dir) {
      r.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sort.key];
        const bv = (b as unknown as Record<string, unknown>)[sort.key];
        if (av == null) return 1; if (bv == null) return -1;
        const cmp = typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv) : String(av).localeCompare(String(bv));
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }
    return r;
  }, [employees, search, typeFilter, statusFilter, sort]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = search || typeFilter !== 'all' || statusFilter !== 'all';

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: '', dir: null };
    });
  };

  const SortIcon = ({ k }: { k: string }) => sort.key !== k ? null : sort.dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;

  if (isLoading) return (
    <div className="p-3">
      <SkeletonTable rows={8} cols={7} />
    </div>
  );

  return (
    <div className="space-y-3 p-3">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as EmployeeType | 'all'); setPage(1); }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50 sm:flex-none"
          >
            <option value="all">All Types</option>
            <option value="W2">W2</option>
            <option value="Contract">Contract</option>
            <option value="1099">1099</option>
            <option value="Offshore">Offshore</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as 'Active' | 'Terminated' | 'all'); setPage(1); }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50 sm:flex-none"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Terminated">Terminated</option>
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setPage(1); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {paged.length} of {filtered.length} employees
        {hasFilters && ` — filtered from ${employees.length} total`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[760px] bg-white">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {[
                { key: 'name', label: 'Employee' },
                { key: 'type', label: 'Type' },
                { key: 'position', label: 'Position' },
                { key: 'state', label: 'Location' },
                { key: 'hireDate', label: 'Hire Date' },
                { key: 'status', label: 'Status' },
              ].map(({ key, label }) => (
                <th key={key} onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
                  <div className="flex items-center gap-1">{label}<SortIcon k={key} /></div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No employees found</td>
              </tr>
            ) : paged.map((emp) => (
              <tr key={emp.id} onClick={() => onView?.(emp)}
                className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {emp.name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.personalEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', typeBadge[emp.type])}>
                    {emp.type}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{emp.position || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{emp.state || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">
                  {emp.hireDate ? format(new Date(emp.hireDate), 'MM/dd/yyyy') : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  {'status' in emp ? (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusBadge[emp.status])}>
                      {emp.status}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        ...(onView ? [{ label: 'View', icon: Eye, onClick: () => onView(emp) }] : []),
                        ...(onEdit ? [{ label: 'Edit', icon: Edit2, onClick: () => onEdit(emp) }] : []),
                        ...(onDelete
                          ? [{ label: 'Delete', icon: Trash2, onClick: () => onDelete(emp), danger: true, separatorBefore: true }]
                          : []),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Rows:
            <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-300">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
