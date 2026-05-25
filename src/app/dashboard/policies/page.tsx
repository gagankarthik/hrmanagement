'use client';

import React, { useState } from 'react';
import { ShieldCheck, CalendarDays, Save, Briefcase, Layers, FileText, Globe2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { useHandbook } from '@/context/HandbookContext';
import { CategoryPolicy } from '@/types/handbook';
import { EmployeeType } from '@/types/employee';
import { UploadedDoc } from '@/types/uploads';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const EMPLOYEE_TYPES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];

type TypeMeta = { icon: React.ElementType; chipBg: string; chipColor: string };
const typeMeta: Record<EmployeeType, TypeMeta> = {
  W2: { icon: Briefcase, chipBg: 'bg-blue-100', chipColor: 'text-blue-600' },
  Contract: { icon: Layers, chipBg: 'bg-purple-100', chipColor: 'text-purple-600' },
  '1099': { icon: FileText, chipBg: 'bg-teal-100', chipColor: 'text-teal-600' },
  Offshore: { icon: Globe2, chipBg: 'bg-pink-100', chipColor: 'text-pink-600' },
};

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const fieldLabel = 'block text-xs font-semibold text-slate-600 mb-1.5';

function PolicyCard({ type, index }: { type: EmployeeType; index: number }) {
  const { getPolicy, savePolicy } = useHandbook();
  const toast = useToast();
  const existing = getPolicy(type);

  const [allowance, setAllowance] = useState<string>(String(existing.annualLeaveAllowance ?? 0));
  const [rules, setRules] = useState<string>(existing.rules ?? '');
  const [documents, setDocuments] = useState<UploadedDoc[]>(existing.documents ?? []);
  const [saving, setSaving] = useState(false);

  const meta = typeMeta[type];
  const Icon = meta.icon;

  const handleSave = async () => {
    setSaving(true);
    try {
      const policy: CategoryPolicy = {
        employeeType: type,
        annualLeaveAllowance: Number(allowance) || 0,
        rules: rules.trim() || undefined,
        documents,
      };
      await savePolicy(policy);
      toast.success('Policy saved', `${type} leave policy has been updated.`);
    } catch (err) {
      toast.error('Could not save policy', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="surface p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.chipBg)}>
          <Icon className={cn('h-4.5 w-4.5', meta.chipColor)} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">{type}</h3>
          <p className="text-xs text-slate-400">Leave policy &amp; documents</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={fieldLabel}>Annual leave allowance (days)</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={0}
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              placeholder="0"
              className={cn(field, 'pl-9')}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Rules / notes</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={3}
            placeholder="e.g. Carryover, accrual, blackout periods…"
            className={cn(field, 'resize-none')}
          />
        </div>

        <DocumentUploader
          value={documents}
          onChange={setDocuments}
          folder={`policies/${type}`}
          label="Policy documents"
        />

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save policy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Company"
        title="Policies"
        description="Set the annual leave allowance, rules, and documents for each employee category"
        tone="brand"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {EMPLOYEE_TYPES.map((type, i) => (
          <PolicyCard key={type} type={type} index={i} />
        ))}
      </div>
    </div>
  );
}
