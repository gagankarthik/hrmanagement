'use client';

import React, { useState } from 'react';
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

  const getEmployeeCount = (vendorId: string, vendorName: string): number =>
    employees.filter((emp) => {
      const inAssignments = emp.vendorAssignments?.some((a) => a.vendorId === vendorId);
      return inAssignments || emp.vendorId === vendorId || emp.vendorName === vendorName;
    }).length;

  const validVendors = vendors.filter((v) => v && v.id);

  const filteredVendors = validVendors.filter((v) => {
    const matchSearch =
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = validVendors.filter((v) => v.status === 'Active').length;
  const totalInactive = validVendors.filter((v) => v.status === 'Inactive').length;

  const handleDelete = async (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (confirm(`Delete "${vendor.name}"? This cannot be undone.`)) {
      try { await deleteVendor(vendor.id); } catch {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage vendor partnerships and contractor firms</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Vendors', value: validVendors.length, icon: Package, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
          { label: 'Active', value: totalActive, icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { label: 'Inactive', value: totalInactive, icon: XCircle, iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', s.iconBg)}>
              <s.icon className={cn('h-5 w-5', s.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {searchQuery ? 'No vendors match your search' : 'No vendors yet'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery ? 'Try different search terms' : 'Add your first vendor to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" /> Add Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_80px_100px_80px] gap-3 px-5 py-3">
              {['Vendor', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>
            {filteredVendors.map((vendor, idx) => {
              const empCount = getEmployeeCount(vendor.id, vendor.name);
              return (
                <div
                  key={vendor.id ?? idx}
                  onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
                  className="grid cursor-pointer grid-cols-[2fr_1.5fr_1.5fr_1fr_80px_100px_80px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-sm font-bold text-white">
                      {vendor.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{vendor.name}</p>
                      {vendor.address && (
                        <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />{vendor.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="truncate text-sm text-slate-600">{vendor.contactPerson || '—'}</span>
                  <span className="flex items-center gap-1 truncate text-sm text-slate-600">
                    {vendor.email ? <><Mail className="h-3 w-3 flex-shrink-0 text-slate-400" />{vendor.email}</> : '—'}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600">
                    {vendor.phone ? <><Phone className="h-3 w-3 flex-shrink-0 text-slate-400" />{vendor.phone}</> : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    <Users className="h-3 w-3" />{empCount}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {vendor.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {vendor.status}
                  </span>
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setModalState({ isOpen: true, mode: 'edit', vendor })}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, vendor)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Showing {filteredVendors.length} of {validVendors.length} vendors</p>
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
