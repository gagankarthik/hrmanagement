'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, Check, Plus, Trash2, Briefcase, FileText, Globe, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
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

const employeeTypes: {
  value: EmployeeType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  iconColor: string;
  border: string;
}[] = [
  {
    value: 'W2',
    label: 'W2 Employee',
    description: 'Full-time employees with benefits and standard payroll',
    icon: Briefcase,
    color: 'blue',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'hover:border-blue-400',
  },
  {
    value: 'Contract',
    label: 'Contract',
    description: 'Temporary contract workers on project basis',
    icon: FileText,
    color: 'purple',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'hover:border-purple-400',
  },
  {
    value: '1099',
    label: '1099',
    description: 'Independent contractors filing 1099 forms',
    icon: FileText,
    color: 'teal',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    border: 'hover:border-teal-400',
  },
  {
    value: 'Offshore',
    label: 'Offshore',
    description: 'International remote employees working offshore',
    icon: Globe,
    color: 'pink',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'hover:border-pink-400',
  },
];

export default function OnboardPage() {
  const router = useRouter();
  const { createEmployee } = useEmployees();
  const toast = useToast();
  const { clients, isLoading: clientsLoading, fetchClients } = useClients();
  const { vendors, isLoading: vendorsLoading, fetchVendors } = useVendors();
  const { subcontractors, fetchSubcontractors } = useSubcontractors();
  const [step, setStep] = useState<1 | 2>(1);
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
        setStep(2);
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

  const fields = useMemo(() => {
    if (!selectedType) return [];
    return getFieldsByType(selectedType).filter(
      (f) => f.name !== 'clientId' && f.name !== 'vendorId'
    );
  }, [selectedType]);

  const handleTypeSelect = (type: EmployeeType) => {
    setSelectedType(type);
    setFormData({ type });
    setClientAssignments([]);
    setVendorAssignments([]);
    setEndClientAssignments([]);
    setEndVendorAssignments([]);
    setSubcontractorAssignments([]);
    setStep(2);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Check the highlighted fields', 'Some required fields need attention.');
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
      setTimeout(() => router.push('/dashboard/employees'), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee. Please try again.';
      setErrors({ submit: message });
      toast.error('Onboarding failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];
    const base = cn(
      'w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors outline-none',
      'placeholder:text-slate-400',
      error
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
    );

    if (field.type === 'select') {
      const loading = (field.name === 'clientId' && clientsLoading) || (field.name === 'vendorId' && vendorsLoading);
      return (
        <select value={String(value)} onChange={(e) => handleInputChange(field, e.target.value)} disabled={loading} className={base}>
          <option value="">{loading ? `Loading…` : `Select ${field.label}`}</option>
          {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    }
    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleInputChange(field, e.target.checked)}
            className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">{field.label}</span>
        </label>
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
          step === 1 ? 'Step 1 of 2 — Select employee type' : `Step 2 of 2 — ${selectedType} employee details`
        }
        actions={
          <Link href="/dashboard/employees" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      {/* Progress steps */}
      <div className="surface flex items-center gap-0 px-5 py-4">
        {[
          { n: 1, label: 'Select Type' },
          { n: 2, label: 'Employee Details' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && (
              <div className={cn('mx-3 h-0.5 flex-1 rounded-full transition-colors', step > i ? 'bg-indigo-600' : 'bg-slate-200')} />
            )}
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                step > s.n
                  ? 'bg-indigo-600 text-white'
                  : step === s.n
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-100 text-slate-400'
              )}>
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span className={cn(
                'font-display text-sm font-semibold',
                step >= s.n ? 'text-indigo-600' : 'text-slate-400'
              )}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Type Selection */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {employeeTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeSelect(type.value)}
              className={cn(
                'group surface surface-hover p-6 text-left',
                type.border
              )}
            >
              <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors', type.iconBg)}>
                <type.icon className={cn('h-6 w-6', type.iconColor)} />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">{type.label}</h3>
              <p className="mt-1 text-sm text-slate-500">{type.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Employee Form */}
      {step === 2 && selectedType && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {draftRestored && (
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-xs font-medium text-amber-800">
                Draft restored from your last session. Submit when ready, or discard to start fresh.
              </p>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setSelectedType(null);
                  setFormData({});
                  setClientAssignments([]);
                  setVendorAssignments([]);
                  setEndClientAssignments([]);
                  setEndVendorAssignments([]);
                  setSubcontractorAssignments([]);
                  setErrors({});
                  setStep(1);
                }}
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Discard draft
              </button>
            </div>
          )}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">{selectedType} Employee Details</h2>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedType(null);
                  setFormData({});
                  setErrors({});
                  setClientAssignments([]);
                  setVendorAssignments([]);
                  setEndClientAssignments([]);
                  setEndVendorAssignments([]);
                  setSubcontractorAssignments([]);
                  clearDraft();
                }}
                className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Change Type
              </button>
            </div>
            <div className="p-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                  <div key={field.name} className={field.type === 'checkbox' ? 'flex items-end pb-1' : ''}>
                    {field.type !== 'checkbox' && (
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </label>
                    )}
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client Assignments */}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">Client Assignments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {clientAssignments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setClientAssignments((prev) => [...prev, { clientId: '', startDate: '', endDate: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Client
              </button>
            </div>
            <div className="p-6">
              {clientAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No client assignments. Click "Add Client" to assign.</p>
              ) : (
                <div className="space-y-3">
                  {clientAssignments.map((assignment, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Client</label>}
                        <select
                          value={assignment.clientId}
                          onChange={(e) => {
                            const next = [...clientAssignments];
                            next[idx] = { ...next[idx], clientId: e.target.value };
                            setClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">Select Client</option>
                          {clients.filter((c) => c?.id && c?.name).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                        <input
                          type="date"
                          value={assignment.startDate || ''}
                          onChange={(e) => {
                            const next = [...clientAssignments];
                            next[idx] = { ...next[idx], startDate: e.target.value };
                            setClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                        <input
                          type="date"
                          value={assignment.endDate || ''}
                          onChange={(e) => {
                            const next = [...clientAssignments];
                            next[idx] = { ...next[idx], endDate: e.target.value };
                            setClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setClientAssignments((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vendor Assignments */}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">Vendor Assignments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {vendorAssignments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVendorAssignments((prev) => [...prev, { vendorId: '', startDate: '', endDate: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Vendor
              </button>
            </div>
            <div className="p-6">
              {vendorAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No vendor assignments. Click "Add Vendor" to assign.</p>
              ) : (
                <div className="space-y-3">
                  {vendorAssignments.map((assignment, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Vendor</label>}
                        <select
                          value={assignment.vendorId}
                          onChange={(e) => {
                            const next = [...vendorAssignments];
                            next[idx] = { ...next[idx], vendorId: e.target.value };
                            setVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        >
                          <option value="">Select Vendor</option>
                          {vendors.filter((v) => v?.id && v?.name).map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                        <input
                          type="date"
                          value={assignment.startDate || ''}
                          onChange={(e) => {
                            const next = [...vendorAssignments];
                            next[idx] = { ...next[idx], startDate: e.target.value };
                            setVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                        <input
                          type="date"
                          value={assignment.endDate || ''}
                          onChange={(e) => {
                            const next = [...vendorAssignments];
                            next[idx] = { ...next[idx], endDate: e.target.value };
                            setVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVendorAssignments((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* End Client Assignments */}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                  <Briefcase className="h-4 w-4 text-sky-600" />
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">End Client Assignments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {endClientAssignments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEndClientAssignments((prev) => [...prev, { clientId: '', startDate: '', endDate: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add End Client
              </button>
            </div>
            <div className="p-6">
              {endClientAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No end client assignments. Click &quot;Add End Client&quot; to assign.</p>
              ) : (
                <div className="space-y-3">
                  {endClientAssignments.map((assignment, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Client</label>}
                        <select
                          value={assignment.clientId}
                          onChange={(e) => {
                            const next = [...endClientAssignments];
                            next[idx] = { ...next[idx], clientId: e.target.value };
                            setEndClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="">Select End Client</option>
                          {clients.filter((c) => c?.id && c?.name).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                        <input
                          type="date"
                          value={assignment.startDate || ''}
                          onChange={(e) => {
                            const next = [...endClientAssignments];
                            next[idx] = { ...next[idx], startDate: e.target.value };
                            setEndClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                        <input
                          type="date"
                          value={assignment.endDate || ''}
                          onChange={(e) => {
                            const next = [...endClientAssignments];
                            next[idx] = { ...next[idx], endDate: e.target.value };
                            setEndClientAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEndClientAssignments((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* End Vendor Assignments */}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Briefcase className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">End Vendor Assignments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {endVendorAssignments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEndVendorAssignments((prev) => [...prev, { vendorId: '', startDate: '', endDate: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add End Vendor
              </button>
            </div>
            <div className="p-6">
              {endVendorAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No end vendor assignments. Click &quot;Add End Vendor&quot; to assign.</p>
              ) : (
                <div className="space-y-3">
                  {endVendorAssignments.map((assignment, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Vendor</label>}
                        <select
                          value={assignment.vendorId}
                          onChange={(e) => {
                            const next = [...endVendorAssignments];
                            next[idx] = { ...next[idx], vendorId: e.target.value };
                            setEndVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        >
                          <option value="">Select End Vendor</option>
                          {vendors.filter((v) => v?.id && v?.name).map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                        <input
                          type="date"
                          value={assignment.startDate || ''}
                          onChange={(e) => {
                            const next = [...endVendorAssignments];
                            next[idx] = { ...next[idx], startDate: e.target.value };
                            setEndVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                        <input
                          type="date"
                          value={assignment.endDate || ''}
                          onChange={(e) => {
                            const next = [...endVendorAssignments];
                            next[idx] = { ...next[idx], endDate: e.target.value };
                            setEndVendorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEndVendorAssignments((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subcontractor Assignments */}
          <div className="surface">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="font-display text-base font-bold text-slate-900">Subcontractor Assignments</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {subcontractorAssignments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSubcontractorAssignments((prev) => [...prev, { subcontractorId: '', startDate: '', endDate: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Subcontractor
              </button>
            </div>
            <div className="p-6">
              {subcontractorAssignments.length === 0 ? (
                <p className="text-sm text-slate-400">No subcontractor assignments. Click &quot;Add Subcontractor&quot; to assign.</p>
              ) : (
                <div className="space-y-3">
                  {subcontractorAssignments.map((assignment, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_36px] sm:gap-3 sm:items-end">
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Subcontractor</label>}
                        <select
                          value={assignment.subcontractorId}
                          onChange={(e) => {
                            const next = [...subcontractorAssignments];
                            next[idx] = { ...next[idx], subcontractorId: e.target.value };
                            setSubcontractorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="">Select Subcontractor</option>
                          {subcontractors.filter((s) => s?.id && s?.name).map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">Start Date</label>}
                        <input
                          type="date"
                          value={assignment.startDate || ''}
                          onChange={(e) => {
                            const next = [...subcontractorAssignments];
                            next[idx] = { ...next[idx], startDate: e.target.value };
                            setSubcontractorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>
                      <div>
                        {idx === 0 && <label className="mb-1.5 block text-xs font-medium text-slate-500">End Date</label>}
                        <input
                          type="date"
                          value={assignment.endDate || ''}
                          onChange={(e) => {
                            const next = [...subcontractorAssignments];
                            next[idx] = { ...next[idx], endDate: e.target.value };
                            setSubcontractorAssignments(next);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubcontractorAssignments((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard/employees"
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
            >
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
