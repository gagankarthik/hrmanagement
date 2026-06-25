'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubcontractors } from '../state/subcontractor.context';
import { Subcontractor, SubcontractorFormData } from '../domain/subcontractor.types';
import { useToast } from '@/components/ui/toast';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';
import { UserCheck, ShieldCheck } from 'lucide-react';

export default function SubcontractorForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Subcontractor }) {
  const router = useRouter();
  const { subcontractors, createSubcontractor, updateSubcontractor } = useSubcontractors();
  const toast = useToast();

  const [form, setForm] = useState<SubcontractorFormData>(
    mode === 'edit' && initial
      ? {
          name: initial.name,
          contactPerson: initial.contactPerson || '',
          email: initial.email || '',
          phone: initial.phone || '',
          address: initial.address || '',
          status: initial.status,
          coiEffectiveDate: initial.coiEffectiveDate || '',
          coiExpiryDate: initial.coiExpiryDate || '',
        }
      : { name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active', coiEffectiveDate: '', coiExpiryDate: '' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof SubcontractorFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/subcontractors/${initial.id}`);
    else router.push('/subcontractors');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Subcontractor name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const before = new Set(subcontractors.map((s) => s.id));
        await createSubcontractor(form);
        toast.success('Subcontractor created', `${form.name} has been added.`);
        // The context's create() doesn't return the new record, so derive its id
        // by diffing the list, falling back to a name match, then the list page.
        const created =
          subcontractors.find((s) => !before.has(s.id)) ||
          subcontractors.find((s) => s.name === form.name.trim());
        router.push(created ? `/subcontractors/${created.id}` : '/subcontractors');
      } else {
        await updateSubcontractor(initial!.id, form);
        toast.success('Subcontractor updated', `${form.name} has been saved.`);
        router.push(`/subcontractors/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create subcontractor' : 'Could not update subcontractor', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        icon={UserCheck}
        title="Subcontractor Details"
        description={mode === 'create' ? 'Create a new subcontractor record' : 'Update subcontractor details'}
      >
        {errors._ && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>
        )}

        <div className="space-y-4">
          <FormField label="Subcontractor Name" required error={errors.name}>
            <Input
              type="text"
              invalid={!!errors.name}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Bright Tech Solutions LLC"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Contact Person">
              <Input type="text" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="Full name" />
            </FormField>
            <FormField label="Status">
              <NativeSelect value={form.status} onChange={(e) => set('status', e.target.value as 'Active' | 'Inactive')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </NativeSelect>
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@subcontractor.com" />
            </FormField>
            <FormField label="Phone">
              <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </FormField>
          </div>

          <FormField label="Address">
            <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="Street, city, state" className="resize-none" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        icon={ShieldCheck}
        title="Certificate of Insurance (COI)"
        description="Track the company's insurance policy dates. The dashboard flags policies expiring within 60 days."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Policy Effective Date">
            <Input type="date" value={form.coiEffectiveDate || ''} onChange={(e) => set('coiEffectiveDate', e.target.value)} />
          </FormField>
          <FormField label="Policy Expiry Date">
            <Input type="date" value={form.coiExpiryDate || ''} onChange={(e) => set('coiExpiryDate', e.target.value)} />
          </FormField>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={cancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Create Subcontractor' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
