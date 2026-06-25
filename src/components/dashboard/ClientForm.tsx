'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/context/ClientContext';
import { Client, ClientFormData } from '@/types/client';
import { useToast } from '@/components/ui/toast';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

export default function ClientForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Client }) {
  const router = useRouter();
  const { createClient, updateClient } = useClients();
  const toast = useToast();

  const [form, setForm] = useState<ClientFormData>(
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

  const set = (k: keyof ClientFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/dashboard/clients/${initial.id}`);
    else router.push('/dashboard/clients');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Client name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createClient(form);
        toast.success('Client created', `${form.name} has been added.`);
        router.push('/dashboard/clients');
      } else {
        await updateClient(initial!.id, form);
        toast.success('Client updated', `${form.name} has been saved.`);
        router.push(`/dashboard/clients/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create client' : 'Could not update client', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        icon={Building2}
        title="Client Details"
        description={mode === 'create' ? 'Create a new client record' : 'Update client details'}
      >
        {errors._ && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>
        )}

        <div className="space-y-4">
          <FormField label="Client Name" required error={errors.name}>
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
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@client.com" />
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
          {mode === 'create' ? 'Create Client' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
