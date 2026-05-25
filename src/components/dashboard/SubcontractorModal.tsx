'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { Subcontractor, SubcontractorFormData } from '@/types/subcontractor';
import { useToast } from '@/components/ui/toast';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

export default function SubcontractorModal({ isOpen, onClose, mode, subcontractor }: {
  isOpen: boolean; onClose: () => void; mode: 'create' | 'edit'; subcontractor?: Subcontractor;
}) {
  const { createSubcontractor, updateSubcontractor } = useSubcontractors();
  const toast = useToast();
  const [form, setForm] = useState<SubcontractorFormData>({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(mode === 'edit' && subcontractor
      ? { name: subcontractor.name, contactPerson: subcontractor.contactPerson || '', email: subcontractor.email || '', phone: subcontractor.phone || '', address: subcontractor.address || '', status: subcontractor.status }
      : { name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' }
    );
    setErrors({});
  }, [mode, subcontractor, isOpen]);

  const set = (k: keyof SubcontractorFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Subcontractor name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createSubcontractor(form);
        toast.success('Subcontractor created', `${form.name} has been added.`);
      } else {
        await updateSubcontractor(subcontractor!.id, form);
        toast.success('Subcontractor updated', `${form.name} has been saved.`);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create subcontractor' : 'Could not update subcontractor', message);
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100">
            <UserCheck className="h-4.5 w-4.5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">
              {mode === 'create' ? 'Add Subcontractor' : 'Edit Subcontractor'}
            </h2>
            <p className="text-xs text-slate-400">{mode === 'create' ? 'Create a new subcontractor record' : 'Update subcontractor details'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {errors._ && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>}

          <div>
            <label className={label}>Subcontractor Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Bright Tech Solutions LLC"
              className={cn(field, errors.name && 'border-red-300 focus:border-red-400 focus:ring-red-50')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@subcontractor.com" className={field} />
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
              {submitting ? 'Saving…' : mode === 'create' ? 'Create Subcontractor' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
