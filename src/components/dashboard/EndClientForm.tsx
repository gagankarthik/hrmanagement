'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEndClients } from '@/context/EndClientContext';
import { EndClient, EndClientFormData } from '@/types/endclient';
import { useToast } from '@/components/ui/toast';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

export default function EndClientForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: EndClient }) {
  const router = useRouter();
  const { createEndClient, updateEndClient } = useEndClients();
  const toast = useToast();

  const [form, setForm] = useState<EndClientFormData>(
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

  const set = (k: keyof EndClientFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/dashboard/endclients/${initial.id}`);
    else router.push('/dashboard/endclients');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'End client name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createEndClient(form);
        toast.success('End client created', `${form.name} has been added.`);
        router.push('/dashboard/endclients');
      } else {
        await updateEndClient(initial!.id, form);
        toast.success('End client updated', `${form.name} has been saved.`);
        router.push(`/dashboard/endclients/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create end client' : 'Could not update end client', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        icon={Building2}
        title="End Client Details"
        description={mode === 'create' ? 'Create a new end client record' : 'Update end client details'}
      >
        {errors._ && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>
        )}

        <div className="space-y-4">
          <FormField label="End Client Name" required error={errors.name}>
            <Input
              type="text"
              invalid={!!errors.name}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Acme Corporation"
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
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@endclient.com" />
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

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={cancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Create End Client' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
