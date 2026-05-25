'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVendors } from '@/context/VendorContext';
import { Vendor, VendorFormData } from '@/types/vendor';
import { useToast } from '@/components/ui/toast';
import { SectionCard } from '@/components/ui/section-card';
import { Package } from 'lucide-react';

const field =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

export default function VendorForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Vendor }) {
  const router = useRouter();
  const { createVendor, updateVendor } = useVendors();
  const toast = useToast();

  const [form, setForm] = useState<VendorFormData>(
    mode === 'edit' && initial
      ? {
          name: initial.name,
          contactPerson: initial.contactPerson || '',
          email: initial.email || '',
          phone: initial.phone || '',
          address: initial.address || '',
          status: initial.status,
        }
      : { name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof VendorFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/dashboard/vendors/${initial.id}`);
    else router.push('/dashboard/vendors');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Vendor name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createVendor(form);
        toast.success('Vendor created', `${form.name} has been added.`);
        router.push('/dashboard/vendors');
      } else {
        await updateVendor(initial!.id, form);
        toast.success('Vendor updated', `${form.name} has been saved.`);
        router.push(`/dashboard/vendors/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create vendor' : 'Could not update vendor', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        icon={Package}
        title="Vendor Details"
        description={mode === 'create' ? 'Create a new vendor record' : 'Update vendor details'}
      >
        {errors._ && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className={label}>Vendor Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Acme Staffing Inc."
              className={cn(field, errors.name && 'border-red-300 focus:border-red-400 focus:ring-red-50')}
            />
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
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@vendor.com" className={field} />
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
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={cancel} disabled={submitting} className="btn-ghost disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create Vendor' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
