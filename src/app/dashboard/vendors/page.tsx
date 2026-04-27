'use client';

import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Pencil, Trash2, Users, Search,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight
} from 'lucide-react';
import VendorModal from '@/components/dashboard/VendorModal';
import { useVendors } from '@/context/VendorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Vendor } from '@/types/vendor';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function VendorsPage() {
  const { vendors, isLoading, deleteVendor } = useVendors();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; vendor?: Vendor }>({
    isOpen: false, mode: 'create',
  });

  const getVendorEmps = (vendorId: string, vendorName: string) =>
    employees.filter((emp) =>
      emp.vendorAssignments?.some((a) => a.vendorId === vendorId) ||
      emp.vendorId === vendorId ||
      emp.vendorName === vendorName
    );

  const getEffectiveStatus = (vendor: Vendor): { status: 'Active' | 'Inactive'; autoInactive: boolean } => {
    const emps = getVendorEmps(vendor.id, vendor.name);
    const allTerminated = emps.length > 0 && emps.every((e) => 'status' in e && e.status === 'Terminated');
    return { status: allTerminated ? 'Inactive' : vendor.status, autoInactive: allTerminated };
  };

  const validVendors = vendors.filter((v) => v && v.id);

  const enriched = useMemo(() =>
    validVendors.map((v) => ({ ...v, ...getEffectiveStatus(v), empCount: getVendorEmps(v.id, v.name).length })),
    [validVendors, employees]
  );

  const filtered = enriched.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.contactPerson?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = enriched.filter((v) => v.status === 'Active').length;
  const totalInactive = enriched.filter((v) => v.status === 'Inactive').length;

  const handleDelete = async (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (confirm(`Delete "${vendor.name}"? This cannot be undone.`)) {
      try { await deleteVendor(vendor.id); } catch {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendors</h1>
          <p className="text-sm text-slate-500">Manage vendor partnerships and contractor firms</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: validVendors.length, icon: Package, bg: 'bg-slate-100', color: 'text-slate-600' },
          { label: 'Active', value: totalActive, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
          { label: 'Inactive', value: totalInactive, icon: XCircle, bg: 'bg-red-100', color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.bg)}>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {searchQuery ? 'No vendors match your search' : 'No vendors yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery ? 'Try different keywords' : 'Add your first vendor to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Vendor', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vendor, idx) => (
                  <tr
                    key={vendor.id ?? idx}
                    onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
                    className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700">
                          {vendor.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{vendor.name}</p>
                          {vendor.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{vendor.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{vendor.contactPerson || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      {vendor.email
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{vendor.email}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {vendor.phone
                        ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{vendor.phone}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <Users className="h-3 w-3" />{vendor.empCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Status with tooltip when auto-inactive */}
                      <div className="relative w-fit">
                        {vendor.autoInactive ? (
                          <div className="group/tip relative">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 cursor-default">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-20">
                              <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
                                All employees are terminated
                              </div>
                              <div className="ml-2.5 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                            </div>
                          </div>
                        ) : vendor.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModalState({ isOpen: true, mode: 'edit', vendor })}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, vendor)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {filtered.length} of {validVendors.length} vendor{validVendors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <VendorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        vendor={modalState.vendor}
      />
    </div>
  );
}
