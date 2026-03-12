'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { Employee, EmployeeType, getColumnsByType } from '@/types/employee';

interface EmployeeTableProps {
  onEdit: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const ITEMS_PER_PAGE = 10;

export default function EmployeeTable({ onEdit, onView, onDelete }: EmployeeTableProps) {
  const { filteredEmployees, filters, isLoading } = useEmployees();
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Get columns based on filter type
  const columns = useMemo(() => {
    if (filters.type === 'All') {
      return [
        { key: 'type', label: 'Type', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'position', label: 'Position', sortable: true },
        { key: 'hireDate', label: 'Hire Date', sortable: true },
        { key: 'state', label: 'State', sortable: true },
        { key: 'personalEmail', label: 'Email', sortable: false },
        { key: 'workAuthorization', label: 'Work Auth', sortable: true },
      ];
    }
    return getColumnsByType(filters.type);
  }, [filters.type]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredEmployees, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEmployees, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCellValue = (employee: Employee, key: string): React.ReactNode => {
    const value = (employee as unknown as Record<string, unknown>)[key];

    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-400">-</span>;
    }

    // Date fields
    if (key.toLowerCase().includes('date') && typeof value === 'string') {
      try {
        return format(new Date(value), 'MMM d, yyyy');
      } catch {
        return value;
      }
    }

    // Status field
    if (key === 'status') {
      return (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            value === 'Active'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
          )}
        >
          {value as string}
        </span>
      );
    }

    // Type field
    if (key === 'type') {
      const typeColors: Record<EmployeeType, string> = {
        W2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        Contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        '1099': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
        Offshore: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
      };
      return (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            typeColors[value as EmployeeType]
          )}
        >
          {value as string}
        </span>
      );
    }

    // Pay/Salary fields
    if (key === 'pay' || key === 'salary') {
      const emp = employee as unknown as Record<string, unknown>;
      const salaryType = emp.salaryType as string | undefined;
      return (
        <span>
          ${Number(value).toLocaleString()}
          {salaryType === 'Hourly' ? '/hr' : key === 'salary' ? '/mo' : '/yr'}
        </span>
      );
    }

    // Boolean fields
    if (typeof value === 'boolean') {
      return value ? (
        <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
      ) : (
        <span className="text-slate-400">No</span>
      );
    }

    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (filteredEmployees.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No employees found</p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Try adjusting your filters or add a new employee
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
                    column.sortable && 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortField === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    {formatCellValue(employee, column.key)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === employee.id ? null : employee.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === employee.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <button
                            onClick={() => {
                              onView(employee);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              onEdit(employee);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onDelete(employee);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedEmployees.length)} of{' '}
            {sortedEmployees.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
