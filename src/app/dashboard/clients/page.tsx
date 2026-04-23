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

  const getEmployeeCount = (clientId: string, clientName: string): number =>
    employees.filter((emp) => {
      const inAssignments = emp.clientAssignments?.some((a) => a.clientId === clientId);
      return inAssignments || emp.clientId === clientId || emp.client === clientName;
    }).length;

  const validClients = clients.filter((c) => c && c.id);

  const filteredClients = validClients.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive = validClients.filter((c) => c.status === 'Active').length;
  const totalInactive = validClients.filter((c) => c.status === 'Inactive').length;

  const handleDelete = async (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    if (confirm(`Delete "${client.name}"? This cannot be undone.`)) {
      try { await deleteClient(client.id); } catch {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage client organizations and relationships</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: validClients.length, icon: Building2, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
          { label: 'Active', value: totalActive, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
          { label: 'Inactive', value: totalInactive, icon: XCircle, color: 'bg-slate-50 text-slate-500', iconBg: 'bg-slate-100' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', s.iconBg)}>
              <s.icon className={cn('h-5 w-5', s.color.split(' ')[1])} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery ? 'Try different search terms' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Add Client
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_80px_100px_80px] gap-3 px-5 py-3">
              {['Client', 'Contact', 'Email', 'Phone', 'Employees', 'Status', ''].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>
            {filteredClients.map((client, idx) => {
              const empCount = getEmployeeCount(client.id, client.name);
              return (
                <div
                  key={client.id ?? idx}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="grid cursor-pointer grid-cols-[2fr_1.5fr_1.5fr_1fr_80px_100px_80px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      {client.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{client.name}</p>
                      {client.address && (
                        <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />{client.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="truncate text-sm text-slate-600">{client.contactPerson || '—'}</span>
                  <span className="flex items-center gap-1 truncate text-sm text-slate-600">
                    {client.email ? <><Mail className="h-3 w-3 flex-shrink-0 text-slate-400" />{client.email}</> : '—'}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600">
                    {client.phone ? <><Phone className="h-3 w-3 flex-shrink-0 text-slate-400" />{client.phone}</> : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    <Users className="h-3 w-3" />{empCount}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    client.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  )}>
                    {client.status === 'Active'
                      ? <CheckCircle2 className="h-3 w-3" />
                      : <XCircle className="h-3 w-3" />}
                    {client.status}
                  </span>
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setModalState({ isOpen: true, mode: 'edit', client })}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, client)}
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
          <p className="text-xs text-slate-400">
            Showing {filteredClients.length} of {validClients.length} clients
          </p>
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
