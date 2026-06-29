'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CalendarDays,
  Save,
  Briefcase,
  Layers,
  FileText,
  Globe2,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { Switch } from '@/components/ui/switch';
import { DetailField, DetailGrid } from '@/components/ui/section-card';
import { useHandbook } from '@/context/HandbookContext';
import { useAccess } from '@/hooks/useAccess';
import { CategoryPolicy, LeaveAccrualTier } from '@/types/handbook';
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

const field =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const fieldLabel = 'block text-xs font-semibold text-slate-600 mb-1.5';
const subHeading =
  'text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2';

/** Local editable form shape — numbers held as strings so blanks stay blank. */
type PolicyForm = {
  definition: string;
  eligible: boolean;
  proRata: boolean;
  allowance: string;
  entitlementWeeks: string;
  accrualTiers: LeaveAccrualTier[];
  noticeStandardWeeks: string;
  noticeExtendedWeeks: string;
  carryOverCapDays: string;
  cashOutMaxDays: string;
  minUsageDays: string;
  publicHolidayNotDeducted: boolean;
  documentationRequired: string;
  rules: string;
  documents: UploadedDoc[];
};

/** Numeric value -> string for inputs (undefined/null -> ''). */
const numStr = (n: number | undefined | null): string =>
  n === undefined || n === null ? '' : String(n);

/** Input string -> optional number (blank -> undefined, never coerce blank to 0). */
const toOptNum = (s: string): number | undefined => {
  const t = s.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
};

function hydrate(p: CategoryPolicy): PolicyForm {
  return {
    definition: p.definition ?? '',
    eligible: p.eligible ?? true,
    proRata: p.proRata ?? false,
    allowance: numStr(p.annualLeaveAllowance ?? 0),
    entitlementWeeks: numStr(p.entitlementWeeks),
    accrualTiers: (p.accrualTiers ?? []).map((t) => ({ ...t })),
    noticeStandardWeeks: numStr(p.noticeStandardWeeks),
    noticeExtendedWeeks: numStr(p.noticeExtendedWeeks),
    carryOverCapDays: numStr(p.carryOverCapDays),
    cashOutMaxDays: numStr(p.cashOutMaxDays),
    minUsageDays: numStr(p.minUsageDays),
    publicHolidayNotDeducted: p.publicHolidayNotDeducted ?? false,
    documentationRequired: p.documentationRequired ?? '',
    rules: p.rules ?? '',
    documents: p.documents ?? [],
  };
}

const STANDARD_FRAMEWORK: Partial<PolicyForm> = {
  allowance: '20',
  entitlementWeeks: '4',
  accrualTiers: [
    { label: '0–5 years', minYears: 0, maxYears: 5, monthlyHours: 10, annualDays: 15 },
    { label: '6–10 years', minYears: 6, maxYears: 10, monthlyHours: 12, annualDays: 18 },
    { label: '11+ years', minYears: 11, monthlyHours: 16, annualDays: 24 },
  ],
  noticeStandardWeeks: '4',
  noticeExtendedWeeks: '8',
  carryOverCapDays: '40',
  cashOutMaxDays: '10',
  minUsageDays: '5',
  publicHolidayNotDeducted: true,
  eligible: true,
};

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'brand';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    brand: 'bg-brand-50 text-brand-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Read-only summary surfacing the key figures of a saved policy. */
function PolicySummary({ policy }: { policy: CategoryPolicy }) {
  const tiers = policy.accrualTiers ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {policy.eligible === false ? (
          <Badge tone="slate">Not eligible</Badge>
        ) : (
          <Badge tone="green">Eligible for paid leave</Badge>
        )}
        {policy.proRata && <Badge tone="amber">Pro-rata</Badge>}
        {policy.publicHolidayNotDeducted && <Badge tone="brand">Public holidays not deducted</Badge>}
      </div>

      <DetailGrid cols={3}>
        <DetailField
          label="Entitlement"
          value={
            <span>
              {policy.annualLeaveAllowance ?? 0} days
              {policy.entitlementWeeks ? ` · ${policy.entitlementWeeks} wks` : ''}
            </span>
          }
        />
        <DetailField
          label="Accrual tiers"
          value={tiers.length ? `${tiers.length} tier${tiers.length === 1 ? '' : 's'}` : undefined}
        />
        <DetailField
          label="Notice (std / ext)"
          value={
            policy.noticeStandardWeeks || policy.noticeExtendedWeeks
              ? `${policy.noticeStandardWeeks ?? '—'} / ${policy.noticeExtendedWeeks ?? '—'} wks`
              : undefined
          }
        />
        <DetailField
          label="Carry-over cap"
          value={policy.carryOverCapDays != null ? `${policy.carryOverCapDays} days` : undefined}
        />
        <DetailField
          label="Cash-out max"
          value={policy.cashOutMaxDays != null ? `${policy.cashOutMaxDays} days` : undefined}
        />
        <DetailField
          label="Min usage"
          value={policy.minUsageDays != null ? `${policy.minUsageDays} days` : undefined}
        />
      </DetailGrid>

      {policy.definition && (
        <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">{policy.definition}</p>
      )}

      {(policy.documents?.length ?? 0) > 0 && (
        <p className="text-xs text-slate-400">
          {policy.documents!.length} document{policy.documents!.length === 1 ? '' : 's'} attached
        </p>
      )}
    </div>
  );
}

function PolicyCard({ type, index }: { type: EmployeeType; index: number }) {
  const { getPolicy, savePolicy } = useHandbook();
  const { canManage } = useAccess();
  const toast = useToast();
  const existing = getPolicy(type);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PolicyForm>(() => hydrate(existing));
  const [saving, setSaving] = useState(false);

  const meta = typeMeta[type];
  const Icon = meta.icon;

  const set = <K extends keyof PolicyForm>(key: K, value: PolicyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openEditor = () => {
    setForm(hydrate(getPolicy(type)));
    setEditing(true);
  };

  const cancelEditor = () => {
    setForm(hydrate(getPolicy(type)));
    setEditing(false);
  };

  const applyStandard = () => setForm((f) => ({ ...f, ...STANDARD_FRAMEWORK }));

  // Accrual tier helpers
  const addTier = () =>
    set('accrualTiers', [...form.accrualTiers, { label: '', minYears: 0 }]);
  const removeTier = (i: number) =>
    set('accrualTiers', form.accrualTiers.filter((_, idx) => idx !== i));
  const updateTier = (i: number, patch: Partial<LeaveAccrualTier>) =>
    set(
      'accrualTiers',
      form.accrualTiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const policy: CategoryPolicy = {
        employeeType: type,
        definition: form.definition.trim() || undefined,
        eligible: form.eligible,
        proRata: form.proRata,
        annualLeaveAllowance: Number(form.allowance) || 0,
        entitlementWeeks: toOptNum(form.entitlementWeeks),
        accrualTiers: form.accrualTiers.map((t) => ({
          label: t.label?.trim() || undefined,
          minYears: Number(t.minYears) || 0,
          maxYears: t.maxYears === undefined || t.maxYears === null ? undefined : Number(t.maxYears),
          monthlyHours:
            t.monthlyHours === undefined || t.monthlyHours === null ? undefined : Number(t.monthlyHours),
          annualDays:
            t.annualDays === undefined || t.annualDays === null ? undefined : Number(t.annualDays),
        })),
        noticeStandardWeeks: toOptNum(form.noticeStandardWeeks),
        noticeExtendedWeeks: toOptNum(form.noticeExtendedWeeks),
        carryOverCapDays: toOptNum(form.carryOverCapDays),
        cashOutMaxDays: toOptNum(form.cashOutMaxDays),
        minUsageDays: toOptNum(form.minUsageDays),
        publicHolidayNotDeducted: form.publicHolidayNotDeducted,
        documentationRequired: form.documentationRequired.trim() || undefined,
        rules: form.rules.trim() || undefined,
        documents: form.documents,
      };
      await savePolicy(policy);
      toast.success('Policy saved', `${type} leave policy has been updated.`);
      setEditing(false);
    } catch (err) {
      toast.error('Could not save policy', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = existing.updatedAt != null || (existing.annualLeaveAllowance ?? 0) > 0;

  return (
    <div
      className="surface p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.chipBg)}>
            <Icon className={cn('h-4.5 w-4.5', meta.chipColor)} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">{type}</h3>
            <p className="text-xs text-slate-400">Company leave policy framework</p>
          </div>
        </div>
        {!editing && canManage && (
          <button type="button" onClick={openEditor} className="btn-ghost">
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            {isConfigured ? 'Edit' : 'Set up'}
          </button>
        )}
      </div>

      {!editing ? (
        isConfigured ? (
          <PolicySummary policy={existing} />
        ) : (
          <p className="text-sm text-slate-400">
            No leave policy configured yet for {type}.
            {canManage ? ' Click “Set up” to define the framework.' : ''}
          </p>
        )
      ) : (
        <div className="space-y-6">
          {/* Apply standard framework */}
          <div className="flex justify-end">
            <button type="button" onClick={applyStandard} className="btn-ghost text-xs">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              Apply standard framework
            </button>
          </div>

          {/* Eligibility & Entitlement */}
          <section className="space-y-3">
            <h4 className={subHeading}>Eligibility &amp; entitlement</h4>
            <div>
              <label className={fieldLabel}>Definition</label>
              <textarea
                value={form.definition}
                onChange={(e) => set('definition', e.target.value)}
                rows={2}
                placeholder="Who this category covers and how leave applies…"
                className={cn(field, 'resize-none')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 px-3.5 py-2.5">
                <Switch
                  checked={form.eligible}
                  onChange={(v) => set('eligible', v)}
                  label="Eligible for paid annual leave"
                />
              </div>
              <div className="rounded-lg border border-slate-200 px-3.5 py-2.5">
                <Switch
                  checked={form.proRata}
                  onChange={(v) => set('proRata', v)}
                  label="Pro-rata entitlement"
                  description="Scaled for part-time / partial-year"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>Annual leave (days)</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    value={form.allowance}
                    onChange={(e) => set('allowance', e.target.value)}
                    placeholder="0"
                    className={cn(field, 'pl-9')}
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Standard weeks</label>
                <input
                  type="number"
                  min={0}
                  value={form.entitlementWeeks}
                  onChange={(e) => set('entitlementWeeks', e.target.value)}
                  placeholder="e.g. 4"
                  className={field}
                />
              </div>
            </div>
          </section>

          {/* Accrual by length of service */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={subHeading}>Accrual by length of service</h4>
              <button type="button" onClick={addTier} className="btn-ghost text-xs">
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Add tier
              </button>
            </div>
            {form.accrualTiers.length === 0 ? (
              <p className="text-xs text-slate-400">No accrual tiers. Add one to scale accrual with tenure.</p>
            ) : (
              <div className="space-y-2.5">
                {form.accrualTiers.map((tier, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 sm:items-end">
                      <div className="col-span-2 sm:col-span-2">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Label
                        </label>
                        <input
                          value={tier.label ?? ''}
                          onChange={(e) => updateTier(i, { label: e.target.value })}
                          placeholder="0–5 years"
                          className={cn(field, 'py-2')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Min yrs
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={numStr(tier.minYears)}
                          onChange={(e) => updateTier(i, { minYears: Number(e.target.value) || 0 })}
                          className={cn(field, 'py-2')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Max yrs
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={numStr(tier.maxYears)}
                          onChange={(e) =>
                            updateTier(i, { maxYears: toOptNum(e.target.value) })
                          }
                          placeholder="∞"
                          className={cn(field, 'py-2')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Mo. hrs
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={numStr(tier.monthlyHours)}
                          onChange={(e) =>
                            updateTier(i, { monthlyHours: toOptNum(e.target.value) })
                          }
                          className={cn(field, 'py-2')}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Ann. days
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={numStr(tier.annualDays)}
                            onChange={(e) =>
                              updateTier(i, { annualDays: toOptNum(e.target.value) })
                            }
                            className={cn(field, 'py-2')}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTier(i)}
                          aria-label="Remove tier"
                          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Taking leave */}
          <section className="space-y-3">
            <h4 className={subHeading}>Taking leave</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={fieldLabel}>Notice — standard (wks)</label>
                <input
                  type="number"
                  min={0}
                  value={form.noticeStandardWeeks}
                  onChange={(e) => set('noticeStandardWeeks', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={fieldLabel}>Notice — extended (wks)</label>
                <input
                  type="number"
                  min={0}
                  value={form.noticeExtendedWeeks}
                  onChange={(e) => set('noticeExtendedWeeks', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={fieldLabel}>Carry-over cap (days)</label>
                <input
                  type="number"
                  min={0}
                  value={form.carryOverCapDays}
                  onChange={(e) => set('carryOverCapDays', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={fieldLabel}>Cash-out max (days)</label>
                <input
                  type="number"
                  min={0}
                  value={form.cashOutMaxDays}
                  onChange={(e) => set('cashOutMaxDays', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={fieldLabel}>Min usage (days)</label>
                <input
                  type="number"
                  min={0}
                  value={form.minUsageDays}
                  onChange={(e) => set('minUsageDays', e.target.value)}
                  className={field}
                />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3.5 py-2.5">
              <Switch
                checked={form.publicHolidayNotDeducted}
                onChange={(v) => set('publicHolidayNotDeducted', v)}
                label="Public holidays not deducted"
                description="Holidays within a leave period aren’t counted"
              />
            </div>
          </section>

          {/* Documentation & notes */}
          <section className="space-y-3">
            <h4 className={subHeading}>Documentation &amp; notes</h4>
            <div>
              <label className={fieldLabel}>Documentation required</label>
              <textarea
                value={form.documentationRequired}
                onChange={(e) => set('documentationRequired', e.target.value)}
                rows={2}
                placeholder="Required documents / approval process…"
                className={cn(field, 'resize-none')}
              />
            </div>
            <div>
              <label className={fieldLabel}>Rules / notes</label>
              <textarea
                value={form.rules}
                onChange={(e) => set('rules', e.target.value)}
                rows={3}
                placeholder="e.g. Carryover, accrual, blackout periods…"
                className={cn(field, 'resize-none')}
              />
            </div>
            <DocumentUploader
              value={form.documents}
              onChange={(docs) => set('documents', docs)}
              folder="policies"
              label="Policy documents"
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={cancelEditor} className="btn-ghost">
              <X className="h-4 w-4" strokeWidth={1.75} />
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" strokeWidth={1.75} />
              {saving ? 'Saving…' : 'Save policy'}
            </button>
          </div>
        </div>
      )}
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
        description="Define the company leave policy framework — entitlement, accrual, and rules — for each employee category"
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
