'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients } from '@/context/ClientContext';
import { Client, ClientFormData } from '@/types/client';
import { useToast } from '@/components/ui/toast';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

export default function ClientModal({ isOpen, onClose, mode, client }: {
  isOpen: boolean; onClose: () => void; mode: 'create' | 'edit'; client?: Client;
}) {
  const { createClient, updateClient } = useClients();
  const toast = useToast();
  const [form, setForm] = useState<ClientFormData>({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(mode === 'edit' && client
      ? { name: client.name, contactPerson: client.contactPerson || '', email: client.email || '', phone: client.phone || '', address: client.address || '', status: client.status }
      : { name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' }
    );
    setErrors({});
  }, [mode, client, isOpen]);

  const set = (k: keyof ClientFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Client name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createClient(form);
        toast.success('Client created', `${form.name} has been added.`);
      } else {
        await updateClient(client!.id, form);
        toast.success('Client updated', `${form.name} has been saved.`);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create client' : 'Could not update client', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <Building2 className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">
              {mode === 'create' ? 'Add Client' : 'Edit Client'}
            </h2>
            <p className="text-xs text-slate-400">{mode === 'create' ? 'Create a new client record' : 'Update client details'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {errors._ && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>}

          <div>
            <label className={label}>Client Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Acme Corporation"
              className={cn(field, errors.name && 'border-red-300 focus:border-red-400 focus:ring-red-50')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Contact Person</label>
              <input type="text" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="Full name" className={field} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as 'Active' | 'Inactive')} className={field}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={label}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@client.com" className={field} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={field} />
            </div>
          </div>

          <div>
            <label className={label}>Address</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="Street, city, state" className={cn(field, 'resize-none')} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-ghost disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : mode === 'create' ? 'Create Client' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
