'use client';

import React, { useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, Search,
  CheckCircle2, XCircle, Phone, Mail, MapPin, ChevronRight
} from 'lucide-react';
import ClientModal from '@/components/dashboard/ClientModal';
import { useClients } from '@/context/ClientContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Client } from '@/types/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ClientsPage() {
  const { clients, isLoading, deleteClient } = useClients();
  const { employees } = useEmployees();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; client?: Client }>({
    isOpen: false, mode: 'create',
  });

  const getEmpCount = (clientId: string, clientName: string) =>
    employees.filter((emp) =>
      emp.clientAssignments?.some((a) => a.clientId === clientId) ||
      emp.clientId === clientId ||
      emp.client === clientName
    ).length;

  const valid = clients.filter((c) => c && c.id);

  const filtered = valid.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = valid.filter((c) => c.status === 'Active').length;
  const totalInactive = valid.filter((c) => c.status === 'Inactive').length;

  const handleDelete = async (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    if (confirm(`Delete "${client.name}"? This cannot be undone.`)) {
      try { await deleteClient(client.id); } catch {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Manage client organizations and relationships</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: valid.length, icon: Building2, bg: 'bg-slate-100', color: 'text-slate-600' },
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
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
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
              <Building2 className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery ? 'Try different keywords' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add Client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Client', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, idx) => {
                  const empCount = getEmpCount(client.id, client.name);
                  return (
                    <tr
                      key={client.id ?? idx}
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                            {client.name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                            {client.address && (
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[140px]">{client.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{client.contactPerson || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        {client.email
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-300" />{client.email}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {client.phone
                          ? <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-300" />{client.phone}</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Users className="h-3 w-3" />{empCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {client.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModalState({ isOpen: true, mode: 'edit', client })}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, client)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">{filtered.length} of {valid.length} client{valid.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <ClientModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        client={modalState.client}
      />
    </div>
  );
}
