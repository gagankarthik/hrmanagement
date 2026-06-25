'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Edit2, Trash2, X, Users } from 'lucide-react';
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

export default function EmployeeDataTable({ employees, onView, onEdit, onDelete, isLoading = false }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Terminated' | 'all'>('all');

  // Pick up a global search from the top-bar (e.g. /dashboard/employees?q=jane)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

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

  const columns: DataTableColumn<Employee>[] = [
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
  ];

  return (
    <div className="space-y-3 p-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Active' | 'Terminated' | 'all')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Terminated">Terminated</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <DataTable<Employee>
          columns={columns}
          data={filtered}
          getRowId={(e) => e.id}
          caption="Employees"
          tableId="employees"
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
