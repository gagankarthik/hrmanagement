'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useBenefits } from '@/context/BenefitsContext';
import { BenefitPlan, BenefitFormData, BenefitType } from '@/types/benefits';
import { EmployeeType } from '@/types/employee';
import { UploadedDoc } from '@/types/uploads';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { EmployeeMultiSelect } from '@/components/dashboard/EmployeeMultiSelect';
import { useToast } from '@/components/ui/toast';
import { SectionCard } from '@/components/ui/section-card';
import { HeartPulse } from 'lucide-react';

const field =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

const BENEFIT_TYPES: BenefitType[] = ['Medical', 'Dental', 'Vision', '401k', 'Life', 'Disability', 'Other'];
const EMPLOYEE_TYPES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];

const emptyForm: BenefitFormData = {
  name: '',
  type: 'Medical',
  provider: '',
  eligibility: [],
  costPerMonth: undefined,
  employerContribution: undefined,
  description: '',
  documents: [],
  status: 'Active',
  enrolledEmployeeIds: [],
};

export default function BenefitForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: BenefitPlan }) {
  const router = useRouter();
  const { plans, createBenefit, updateBenefit } = useBenefits();
  const toast = useToast();

  const [form, setForm] = useState<BenefitFormData>(
    mode === 'edit' && initial
      ? {
          name: initial.name,
          type: initial.type,
          provider: initial.provider || '',
          eligibility: initial.eligibility || [],
          costPerMonth: initial.costPerMonth,
          employerContribution: initial.employerContribution,
          description: initial.description || '',
          documents: initial.documents || [],
          status: initial.status,
          enrolledEmployeeIds: initial.enrolledEmployeeIds || [],
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof BenefitFormData>(k: K, v: BenefitFormData[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((p) => { const e = { ...p }; delete e[k as string]; return e; });
  };

  const setNumber = (k: 'costPerMonth' | 'employerContribution', raw: string) => {
    set(k, raw === '' ? undefined : Number(raw));
  };

  const toggleEligibility = (t: EmployeeType) => {
    setForm((p) => ({
      ...p,
      eligibility: p.eligibility.includes(t)
        ? p.eligibility.filter((x) => x !== t)
        : [...p.eligibility, t],
    }));
  };

  const setDocs = (docs: UploadedDoc[]) => set('documents', docs);

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/dashboard/benefits/${initial.id}`);
    else router.push('/dashboard/benefits');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setErrors({ name: 'Plan name is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const before = new Set(plans.map((p) => p.id));
        await createBenefit(form);
        toast.success('Benefit created', `${form.name} has been added.`);
        // The context's create() doesn't return the new record, so derive its id
        // by diffing the list, falling back to a name match, then the list page.
        const created =
          plans.find((p) => !before.has(p.id)) ||
          plans.find((p) => p.name === form.name.trim());
        router.push(created ? `/dashboard/benefits/${created.id}` : '/dashboard/benefits');
      } else {
        await updateBenefit(initial!.id, form);
        toast.success('Benefit updated', `${form.name} has been saved.`);
        router.push(`/dashboard/benefits/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create benefit' : 'Could not update benefit', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        icon={HeartPulse}
        title="Plan Details"
        description={mode === 'create' ? 'Create a new benefit plan' : 'Update benefit plan details'}
      >
        {errors._ && (
          <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className={label}>Plan Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. PPO Health Plan"
              className={cn(field, errors.name && 'border-red-300 focus:border-red-400 focus:ring-red-50')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value as BenefitType)} className={field}>
                {BENEFIT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as 'Active' | 'Inactive')} className={field}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Provider</label>
            <input type="text" value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Blue Cross Blue Shield" className={field} />
          </div>

          <div>
            <label className={label}>Eligibility</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EMPLOYEE_TYPES.map((t) => {
                const checked = form.eligibility.includes(t);
                return (
                  <label
                    key={t}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      checked ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEligibility(t)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                    />
                    {t}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={HeartPulse}
        title="Enrolled employees"
        description="Eligibility above sets which categories may enroll. Choose the specific employees actually enrolled in this plan."
      >
        <EmployeeMultiSelect
          value={form.enrolledEmployeeIds || []}
          onChange={(ids) => set('enrolledEmployeeIds', ids)}
        />
      </SectionCard>

      <SectionCard
        icon={HeartPulse}
        title="Cost & Coverage"
        description="Monthly cost, employer contribution, and plan documents"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Cost / Month ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPerMonth ?? ''}
                onChange={(e) => setNumber('costPerMonth', e.target.value)}
                placeholder="0.00"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Employer Contribution ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.employerContribution ?? ''}
                onChange={(e) => setNumber('employerContribution', e.target.value)}
                placeholder="0.00"
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Summary of coverage, network, deductibles…" className={cn(field, 'resize-none')} />
          </div>

          <DocumentUploader
            value={form.documents}
            onChange={setDocs}
            folder="benefits"
            label="Plan Documents"
          />
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={cancel} disabled={submitting} className="btn-ghost disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create Plan' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
