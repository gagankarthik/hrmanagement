'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, ArrowRight, Check, Plus, Trash2, Briefcase, Users, UserCheck, Upload, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Stepper } from '@/components/ui/stepper';
import { SectionCard, DetailField, DetailGrid } from '@/components/ui/section-card';
import { EMPLOYEE_FORM_SECTIONS, sectionForField } from '@/lib/employee-form-sections';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import {
  EmployeeType,
  FormField,
  getFieldsByType,
  EmployeeClientAssignment,
  EmployeeVendorAssignment,
  EmployeeEndClientAssignment,
  EmployeeEndVendorAssignment,
  EmployeeSubcontractorAssignment,
} from '@/types/employee';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Confetti } from '@/components/ui/confetti';
import { BulkImportModal } from '@/components/dashboard/BulkImportModal';
import { EMPLOYEE_IMPORTS } from '@/lib/bulk-import/configs';
import { employeeTypes, WIZARD_STEPS, WizardStep } from './_components/constants';
import { ReviewAssignmentList } from './_components/ReviewAssignmentList';

export default function OnboardPage() {
  const router = useRouter();
  const { createEmployee, fetchEmployees } = useEmployees();
  const toast = useToast();
  const { clients, fetchClients } = useClients();
  const { vendors, fetchVendors } = useVendors();
  const { subcontractors, fetchSubcontractors } = useSubcontractors();
  const [step, setStep] = useState<WizardStep>(0);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EmployeeType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clientAssignments, setClientAssignments] = useState<EmployeeClientAssignment[]>([]);
  const [vendorAssignments, setVendorAssignments] = useState<EmployeeVendorAssignment[]>([]);
  const [endClientAssignments, setEndClientAssignments] = useState<EmployeeEndClientAssignment[]>([]);
  const [endVendorAssignments, setEndVendorAssignments] = useState<EmployeeEndVendorAssignment[]>([]);
  const [subcontractorAssignments, setSubcontractorAssignments] = useState<EmployeeSubcontractorAssignment[]>([]);
  const [draftRestored, setDraftRestored] = useState(false);

  const DRAFT_KEY = 'zenhr:onboard-draft:v1';

  useEffect(() => {
    fetchClients();
    fetchVendors();
    fetchSubcontractors();
  }, [fetchClients, fetchVendors, fetchSubcontractors]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        selectedType?: EmployeeType;
        formData?: Record<string, unknown>;
        clientAssignments?: EmployeeClientAssignment[];
        vendorAssignments?: EmployeeVendorAssignment[];
        endClientAssignments?: EmployeeEndClientAssignment[];
        endVendorAssignments?: EmployeeEndVendorAssignment[];
        subcontractorAssignments?: EmployeeSubcontractorAssignment[];
      };
      if (draft.selectedType) {
        setSelectedType(draft.selectedType);
        setFormData(draft.formData || { type: draft.selectedType });
        setClientAssignments(draft.clientAssignments || []);
        setVendorAssignments(draft.vendorAssignments || []);
        setEndClientAssignments(draft.endClientAssignments || []);
        setEndVendorAssignments(draft.endVendorAssignments || []);
        setSubcontractorAssignments(draft.subcontractorAssignments || []);
        setStep(1);
        setDraftRestored(true);
      }
    } catch {
      // ignore malformed drafts
    }
  }, []);

  // Persist draft whenever the form changes (after type chosen and not yet submitted)
  useEffect(() => {
    if (!selectedType || success) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          selectedType,
          formData,
          clientAssignments,
          vendorAssignments,
          endClientAssignments,
          endVendorAssignments,
          subcontractorAssignments,
        })
      );
    } catch {
      // quota or disabled storage — silent
    }
  }, [selectedType, formData, clientAssignments, vendorAssignments, endClientAssignments, endVendorAssignments, subcontractorAssignments, success]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    setDraftRestored(false);
  };

  const resetAll = () => {
    setSelectedType(null);
    setFormData({});
    setErrors({});
    setClientAssignments([]);
    setVendorAssignments([]);
    setEndClientAssignments([]);
    setEndVendorAssignments([]);
    setSubcontractorAssignments([]);
  };

  // Metadata (icon / colors / description) for the chosen type — drives the
  // "selected type" banner shown on the details & review steps.
  const selectedMeta = useMemo(
    () => employeeTypes.find((t) => t.value === selectedType) ?? null,
    [selectedType]
  );

  const fields = useMemo(() => {
    if (!selectedType) return [];
    return getFieldsByType(selectedType).filter(
      (f) => f.name !== 'clientId' && f.name !== 'vendorId'
    );
  }, [selectedType]);

  // Group the applicable fields into the ordered EMPLOYEE_FORM_SECTIONS buckets.
  const groupedSections = useMemo(() => {
    return EMPLOYEE_FORM_SECTIONS.map((section) => ({
      ...section,
      sectionFields: fields.filter((f) => sectionForField(f.name) === section.id),
    })).filter((section) => section.sectionFields.length > 0);
  }, [fields]);

  // Any applicable fields that don't map to a known section.
  const otherFields = useMemo(
    () => fields.filter((f) => sectionForField(f.name) === 'other'),
    [fields]
  );

  const handleTypeSelect = (type: EmployeeType) => {
    // Re-selecting the current type (e.g. after "Change type") keeps entered data.
    if (type === selectedType) return;
    setSelectedType(type);
    setFormData({ type });
    setClientAssignments([]);
    setVendorAssignments([]);
    setEndClientAssignments([]);
    setEndVendorAssignments([]);
    setSubcontractorAssignments([]);
    setErrors({});
  };

  const handleInputChange = (field: FormField, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field.name]: value }));
    if (errors[field.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field.name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
      if (field.type === 'email' && formData[field.name]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData[field.name]))) {
          newErrors[field.name] = 'Invalid email format';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 → Step 3 (validate before moving to review)
  const goToReview = () => {
    if (!validateForm()) {
      toast.warning('Check the highlighted fields', 'Some required fields need attention.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.warning('Check the highlighted fields', 'Some required fields need attention.');
      setStep(1);
      return;
    }
    setIsSubmitting(true);
    try {
      const activeClient = clientAssignments.find((a) => !a.endDate || new Date(a.endDate) >= new Date());
      const activeVendor = vendorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= new Date());
      const activeEndClient = endClientAssignments.find((a) => !a.endDate || new Date(a.endDate) >= new Date());
      const activeEndVendor = endVendorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= new Date());
      const activeSubcontractor = subcontractorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= new Date());
      const payload = {
        ...formData,
        clientAssignments: clientAssignments.length ? clientAssignments : undefined,
        vendorAssignments: vendorAssignments.length ? vendorAssignments : undefined,
        endClientAssignments: endClientAssignments.length ? endClientAssignments : undefined,
        endVendorAssignments: endVendorAssignments.length ? endVendorAssignments : undefined,
        subcontractorAssignments: subcontractorAssignments.length ? subcontractorAssignments : undefined,
        clientId: activeClient?.clientId || undefined,
        vendorId: activeVendor?.vendorId || undefined,
        endClientId: activeEndClient?.clientId || undefined,
        endVendorId: activeEndVendor?.vendorId || undefined,
        subcontractorId: activeSubcontractor?.subcontractorId || undefined,
      };
      await createEmployee(payload as Parameters<typeof createEmployee>[0]);
      const name = (formData.name as string | undefined) || 'Employee';
      toast.success('Employee onboarded', `${name} has been added to the workforce.`);
      clearDraft();
      setSuccess(true);
      setTimeout(() => router.push('/employees'), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee. Please try again.';
      setErrors({ submit: message });
      toast.error('Onboarding failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Name resolvers (never show raw UUIDs) ----
  const clientName = (id?: string) => clients.find((c) => c?.id === id)?.name || id || '—';
  const vendorName = (id?: string) => vendors.find((v) => v?.id === id)?.name || id || '—';
  const subcontractorName = (id?: string) => subcontractors.find((s) => s?.id === id)?.name || id || '—';

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return 'No dates set';
    return `${start || '—'} → ${end || 'Ongoing'}`;
  };

  // Resolve a scalar field's display value (uses option labels for selects).
  const displayValue = (field: FormField): React.ReactNode => {
    const raw = formData[field.name];
    if (field.type === 'checkbox') return raw ? 'Yes' : 'No';
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (field.type === 'select' && field.options) {
      return field.options.find((o) => o.value === String(raw))?.label || String(raw);
    }
    return String(raw);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];
    const base = cn(
      'w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors outline-none',
      'placeholder:text-slate-400',
      error
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
    );

    if (field.type === 'select') {
      return (
        <select value={String(value)} onChange={(e) => handleInputChange(field, e.target.value)} className={base}>
          <option value="">{`Select ${field.label}`}</option>
          {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    }
    if (field.type === 'checkbox') {
      const on = Boolean(value);
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => handleInputChange(field, !on)}
          className={cn(
            'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors',
            on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          <span>{on ? 'Yes' : 'No'}</span>
          <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-brand-600' : 'bg-slate-300')}>
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
          </span>
        </button>
      );
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={String(value)}
          onChange={(e) => handleInputChange(field, e.target.valueAsNumber || '')}
          placeholder={field.placeholder}
          className={base}
          min="0"
          step={/pay|salary|rate/i.test(field.name) ? '0.01' : '1'}
        />
      );
    }
    return (
      <input
        type={field.type}
        value={String(value)}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={field.placeholder}
        className={base}
      />
    );
  };

  // Render a labelled input cell for the details step.
  const renderFieldCell = (field: FormField) => (
    <div key={field.name}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {field.hint && (
          <span className="group relative inline-flex">
            <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-52 -translate-x-1/2 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-lg group-hover:block">
              {field.hint}
            </span>
          </span>
        )}
      </div>
      {renderField(field)}
      {errors[field.name] && (
        <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
      )}
    </div>
  );

  // Generic assignment editor block (reused for all five assignment kinds).
  const renderAssignmentEditor = <T,>(config: {
    title: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    addBtn: string;
    selectLabel: string;
    selectClasses: string;
    list: T[];
    setList: React.Dispatch<React.SetStateAction<T[]>>;
    options: { id: string; name: string }[];
    idKey: keyof T;
    emptyText: string;
    addLabel: string;
  }) => {
    const { icon: Icon } = config;
    const setField = (idx: number, patch: Record<string, string>) => {
      config.setList((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch } as T;
        return next;
      });
    };
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', config.iconBg)}>
              <Icon className={cn('h-4 w-4', config.iconColor)} strokeWidth={1.75} />
            </div>
            <h4 className="font-display text-sm font-bold text-slate-900">{config.title}</h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {config.list.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => config.setList((prev) => [...prev, { [config.idKey]: '', startDate: '', endDate: '' } as T])}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', config.addBtn)}
          >
            <Plus className="h-3.5 w-3.5" />
            {config.addLabel}
          </button>
        </div>
        {config.list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">{config.emptyText}</p>
        ) : (
          <div className="space-y-3">
            {config.list.map((assignment, idx) => {
              const a = assignment as unknown as { startDate?: string; endDate?: string } & Record<string, string>;
              return (
                <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                  <div>
                    {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">{config.selectLabel}</label>}
                    <select
                      value={(a[config.idKey as string] as string) || ''}
                      onChange={(e) => setField(idx, { [config.idKey as string]: e.target.value })}
                      className={cn('w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none', config.selectClasses)}
                    >
                      <option value="">{`Select ${config.selectLabel}`}</option>
                      {config.options.filter((o) => o?.id && o?.name).map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                    <input
                      type="date"
                      value={a.startDate || ''}
                      onChange={(e) => setField(idx, { startDate: e.target.value })}
                      className={cn('w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none', config.selectClasses)}
                    />
                  </div>
                  <div>
                    {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                    <input
                      type="date"
                      value={a.endDate || ''}
                      onChange={(e) => setField(idx, { endDate: e.target.value })}
                      className={cn('w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none', config.selectClasses)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => config.setList((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const hasAnyAssignment =
    clientAssignments.length > 0 ||
    vendorAssignments.length > 0 ||
    endClientAssignments.length > 0 ||
    endVendorAssignments.length > 0 ||
    subcontractorAssignments.length > 0;

  if (success) {
    return (
      <>
        <Confetti active count={120} duration={2800} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50 animate-in zoom-in-50 duration-300">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {((formData.name as string | undefined) || 'Employee')} onboarded!
            </h2>
            <p className="mt-2 text-sm text-slate-500">Welcome aboard. Redirecting to the employees list…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={UserPlus}
        eyebrow="Onboarding"
        title="Onboard New Employee"
        description={
          step === 0
            ? 'Step 1 of 3 — Select employee type'
            : step === 1
            ? `Step 2 of 3 — ${selectedType} employee details`
            : 'Step 3 of 3 — Review & confirm'
        }
        actions={
          <>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" /> Import
            </button>
            <Link href="/employees" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </>
        }
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        configs={EMPLOYEE_IMPORTS}
        title="Import Employees"
        lookups={{ clients, vendors }}
        onImported={(n) => {
          fetchEmployees();
          toast.success('Employees imported', `${n} employee${n !== 1 ? 's' : ''} added.`);
        }}
      />

      {/* Stepper */}
      <div className="surface px-5 py-4">
        <Stepper steps={WIZARD_STEPS} current={step} />
      </div>

      {/* Step 1: Type Selection */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {employeeTypes.map((type) => {
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    'surface p-6 text-left transition-all',
                    isSelected ? type.selectedBorder : cn('border border-transparent', type.ring)
                  )}
                >
                  <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors', type.iconBg)}>
                    <type.icon className={cn('h-6 w-6', type.iconColor)} strokeWidth={1.75} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900">{type.label}</h3>
                    {isSelected && <Check className="h-4 w-4 text-brand-600" strokeWidth={2.5} />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{type.description}</p>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Link href="/employees" className="btn-ghost">Cancel</Link>
            <button
              type="button"
              disabled={!selectedType}
              onClick={() => selectedType && setStep(1)}
              className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Employee Details */}
      {step === 1 && selectedType && (
        <div className="space-y-6">
          {/* Locked-in type banner — the chosen type gates the fields below */}
          {selectedMeta && (
            <div className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', selectedMeta.iconBg)}>
                  <selectedMeta.icon className={cn('h-5 w-5', selectedMeta.iconColor)} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-slate-900">{selectedMeta.label}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Selected type
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Showing the fields specific to {selectedMeta.label.replace(/ Employee$/, '')} employees.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setStep(0)} className="btn-ghost">
                <RefreshCw className="h-4 w-4" />
                Change type
              </button>
            </div>
          )}

          {draftRestored && (
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-xs font-medium text-amber-800">
                Draft restored from your last session. Continue when ready, or discard to start fresh.
              </p>
              <button
                type="button"
                onClick={() => { clearDraft(); resetAll(); setStep(0); }}
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Discard draft
              </button>
            </div>
          )}

          {/* Grouped scalar field sections */}
          {groupedSections.map((section) => (
            <SectionCard key={section.id} title={section.title} description={section.description}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {section.sectionFields.map(renderFieldCell)}
              </div>
            </SectionCard>
          ))}

          {otherFields.length > 0 && (
            <SectionCard title="Additional Details">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otherFields.map(renderFieldCell)}
              </div>
            </SectionCard>
          )}

          {/* Assignments */}
          <SectionCard
            icon={Users}
            title="Assignments"
            description="Client, vendor, end-client, end-vendor and subcontractor placements"
          >
            <div className="space-y-6">
              {renderAssignmentEditor<EmployeeClientAssignment>({
                title: 'Client Assignments',
                icon: Users,
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                addBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                selectLabel: 'Client',
                selectClasses: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
                list: clientAssignments,
                setList: setClientAssignments,
                options: clients,
                idKey: 'clientId',
                emptyText: 'No client assignments yet.',
                addLabel: 'Add Client',
              })}
              {renderAssignmentEditor<EmployeeVendorAssignment>({
                title: 'Vendor Assignments',
                icon: Users,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                addBtn: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                selectLabel: 'Vendor',
                selectClasses: 'focus:border-purple-400 focus:ring-2 focus:ring-purple-100',
                list: vendorAssignments,
                setList: setVendorAssignments,
                options: vendors,
                idKey: 'vendorId',
                emptyText: 'No vendor assignments yet.',
                addLabel: 'Add Vendor',
              })}
              {renderAssignmentEditor<EmployeeEndClientAssignment>({
                title: 'End Client Assignments',
                icon: Briefcase,
                iconBg: 'bg-sky-100',
                iconColor: 'text-sky-600',
                addBtn: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
                selectLabel: 'End Client',
                selectClasses: 'focus:border-sky-400 focus:ring-2 focus:ring-sky-100',
                list: endClientAssignments,
                setList: setEndClientAssignments,
                options: clients,
                idKey: 'clientId',
                emptyText: 'No end client assignments yet.',
                addLabel: 'Add End Client',
              })}
              {renderAssignmentEditor<EmployeeEndVendorAssignment>({
                title: 'End Vendor Assignments',
                icon: Briefcase,
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600',
                addBtn: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                selectLabel: 'End Vendor',
                selectClasses: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                list: endVendorAssignments,
                setList: setEndVendorAssignments,
                options: vendors,
                idKey: 'vendorId',
                emptyText: 'No end vendor assignments yet.',
                addLabel: 'Add End Vendor',
              })}
              {renderAssignmentEditor<EmployeeSubcontractorAssignment>({
                title: 'Subcontractor Assignments',
                icon: UserCheck,
                iconBg: 'bg-teal-100',
                iconColor: 'text-teal-600',
                addBtn: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
                selectLabel: 'Subcontractor',
                selectClasses: 'focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
                list: subcontractorAssignments,
                setList: setSubcontractorAssignments,
                options: subcontractors,
                idKey: 'subcontractorId',
                emptyText: 'No subcontractor assignments yet.',
                addLabel: 'Add Subcontractor',
              })}
            </div>
          </SectionCard>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setStep(0); }}
              className="btn-ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button type="button" onClick={goToReview} className="btn-primary px-6">
              Review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 2 && selectedType && (
        <div className="space-y-6">
          <div className="surface flex flex-wrap items-center gap-3 px-5 py-4">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-sm font-semibold',
                selectedType === 'W2' && 'bg-blue-100 text-blue-700',
                selectedType === 'Contract' && 'bg-purple-100 text-purple-700',
                selectedType === '1099' && 'bg-teal-100 text-teal-700',
                selectedType === 'Offshore' && 'bg-pink-100 text-pink-700'
              )}
            >
              {selectedType} Employee
            </span>
            <p className="text-sm text-slate-500">Please review the details below before adding this employee.</p>
          </div>

          {/* Grouped read-only sections */}
          {groupedSections.map((section) => (
            <SectionCard key={section.id} title={section.title} description={section.description}>
              <DetailGrid>
                {section.sectionFields.map((field) => (
                  <DetailField key={field.name} label={field.label} value={displayValue(field)} />
                ))}
              </DetailGrid>
            </SectionCard>
          ))}

          {otherFields.length > 0 && (
            <SectionCard title="Additional Details">
              <DetailGrid>
                {otherFields.map((field) => (
                  <DetailField key={field.name} label={field.label} value={displayValue(field)} />
                ))}
              </DetailGrid>
            </SectionCard>
          )}

          {/* Assignments review (resolved names + date ranges) */}
          <SectionCard icon={Users} title="Assignments" description="Resolved placements and date ranges">
            {!hasAnyAssignment ? (
              <p className="text-sm text-slate-400">No assignments added.</p>
            ) : (
              <div className="space-y-5">
                {clientAssignments.length > 0 && (
                  <ReviewAssignmentList
                    label="Client Assignments"
                    rows={clientAssignments.map((a) => ({ name: clientName(a.clientId), range: formatDateRange(a.startDate, a.endDate) }))}
                  />
                )}
                {vendorAssignments.length > 0 && (
                  <ReviewAssignmentList
                    label="Vendor Assignments"
                    rows={vendorAssignments.map((a) => ({ name: vendorName(a.vendorId), range: formatDateRange(a.startDate, a.endDate) }))}
                  />
                )}
                {endClientAssignments.length > 0 && (
                  <ReviewAssignmentList
                    label="End Client Assignments"
                    rows={endClientAssignments.map((a) => ({ name: clientName(a.clientId), range: formatDateRange(a.startDate, a.endDate) }))}
                  />
                )}
                {endVendorAssignments.length > 0 && (
                  <ReviewAssignmentList
                    label="End Vendor Assignments"
                    rows={endVendorAssignments.map((a) => ({ name: vendorName(a.vendorId), range: formatDateRange(a.startDate, a.endDate) }))}
                  />
                )}
                {subcontractorAssignments.length > 0 && (
                  <ReviewAssignmentList
                    label="Subcontractor Assignments"
                    rows={subcontractorAssignments.map((a) => ({ name: subcontractorName(a.subcontractorId), range: formatDateRange(a.startDate, a.endDate) }))}
                  />
                )}
              </div>
            )}
          </SectionCard>

          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="btn-ghost disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Confirm & Add Employee
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
