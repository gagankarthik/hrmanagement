'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from '@/components/ui/section-card';
import { EMPLOYEE_FORM_SECTIONS, sectionForField } from '@/lib/employee-form-sections';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useEndClients } from '@/context/EndClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import {
  Employee,
  EmployeeType,
  FormField,
  getFieldsByType,
  EmployeeClientAssignment,
  EmployeeVendorAssignment,
  EmployeeEndClientAssignment,
  EmployeeEndVendorAssignment,
  EmployeeSubcontractorAssignment,
} from '@/types/employee';
import { useToast } from '@/components/ui/toast';

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  initial?: Employee;
  defaultType?: EmployeeType;
}

const employeeTypes: { value: EmployeeType; label: string }[] = [
  { value: 'W2', label: 'W2 Employee' },
  { value: 'Contract', label: 'Contract' },
  { value: '1099', label: '1099' },
  { value: 'Offshore', label: 'Offshore' },
];

const typeBadge: Record<EmployeeType, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

/**
 * Reusable, routed (non-dialog) employee form for both create and edit modes.
 * Scalar fields are grouped into EMPLOYEE_FORM_SECTIONS; the client / vendor /
 * end-client / end-vendor / subcontractor placements live in an Assignments card.
 * On success it toasts and navigates to the employee detail page.
 */
export default function EmployeeForm({ mode, initial, defaultType = 'W2' }: EmployeeFormProps) {
  const router = useRouter();
  const { createEmployee, updateEmployee } = useEmployees();
  const toast = useToast();
  const { clients, isLoading: clientsLoading, fetchClients } = useClients();
  const { endClients, isLoading: endClientsLoading, fetchEndClients } = useEndClients();
  const { vendors, isLoading: vendorsLoading, fetchVendors } = useVendors();
  const { subcontractors, isLoading: subcontractorsLoading, fetchSubcontractors } = useSubcontractors();

  const [selectedType, setSelectedType] = useState<EmployeeType>(initial?.type ?? defaultType);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure related entities are loaded.
  useEffect(() => {
    fetchClients();
    fetchEndClients();
    fetchVendors();
    fetchSubcontractors();
  }, [fetchClients, fetchEndClients, fetchVendors, fetchSubcontractors]);

  // Initialize form data (and migrate any legacy single-id fields to assignment arrays).
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setSelectedType(initial.type);
      const data: Record<string, unknown> = { ...initial };
      if (!data.clientAssignments) {
        data.clientAssignments = data.clientId
          ? [{ clientId: data.clientId, startDate: '', endDate: '' }]
          : [];
      }
      if (!data.vendorAssignments) {
        data.vendorAssignments = data.vendorId
          ? [{ vendorId: data.vendorId, startDate: '', endDate: '' }]
          : [];
      }
      if (!data.endClientAssignments) {
        data.endClientAssignments = data.endClientId
          ? [{ clientId: data.endClientId, startDate: '', endDate: '' }]
          : [];
      }
      if (!data.endVendorAssignments) {
        data.endVendorAssignments = data.endVendorId
          ? [{ vendorId: data.endVendorId, startDate: '', endDate: '' }]
          : [];
      }
      if (!data.subcontractorAssignments) {
        data.subcontractorAssignments = data.subcontractorId
          ? [{ subcontractorId: data.subcontractorId, startDate: '', endDate: '' }]
          : [];
      }
      setFormData(data);
    } else {
      setFormData({
        type: selectedType,
        clientAssignments: [],
        vendorAssignments: [],
        endClientAssignments: [],
        endVendorAssignments: [],
        subcontractorAssignments: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initial]);

  // Fields for the selected type, with client/vendor options populated.
  const fields = useMemo(() => {
    return getFieldsByType(selectedType).map((field) => {
      if (field.name === 'clientId') {
        return { ...field, options: clients.filter((c) => c && c.id && c.name).map((c) => ({ value: c.id, label: c.name })) };
      }
      if (field.name === 'vendorId') {
        return { ...field, options: vendors.filter((v) => v && v.id && v.name).map((v) => ({ value: v.id, label: v.name })) };
      }
      return field;
    });
  }, [selectedType, clients, vendors]);

  // Scalar fields (clientId/vendorId handled via the assignment editors below).
  const scalarFields = useMemo(
    () => fields.filter((f) => f.name !== 'clientId' && f.name !== 'vendorId'),
    [fields]
  );

  const groupedSections = useMemo(() => {
    return EMPLOYEE_FORM_SECTIONS.map((section) => ({
      ...section,
      sectionFields: scalarFields.filter((f) => sectionForField(f.name) === section.id),
    })).filter((section) => section.sectionFields.length > 0);
  }, [scalarFields]);

  const otherFields = useMemo(
    () => scalarFields.filter((f) => sectionForField(f.name) === 'other'),
    [scalarFields]
  );

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.name]))) {
          newErrors[field.name] = 'Invalid email format';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    if (mode === 'edit' && initial) {
      router.push(`/employees/${initial.id}`);
    } else {
      router.push('/employees');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Check the highlighted fields', 'Some required fields need attention.');
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date();

      const clientAssignments = (formData.clientAssignments as EmployeeClientAssignment[] || []).filter((a) => a.clientId);
      const activeClient = clientAssignments.find((a) => !a.endDate || new Date(a.endDate) >= now);
      const primaryClientId = activeClient?.clientId || clientAssignments[clientAssignments.length - 1]?.clientId || '';

      const vendorAssignments = (formData.vendorAssignments as EmployeeVendorAssignment[] || []).filter((a) => a.vendorId);
      const activeVendor = vendorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= now);
      const primaryVendorId = activeVendor?.vendorId || vendorAssignments[vendorAssignments.length - 1]?.vendorId || '';

      const endClientAssignments = (formData.endClientAssignments as EmployeeEndClientAssignment[] || []).filter((a) => a.clientId);
      const activeEndClient = endClientAssignments.find((a) => !a.endDate || new Date(a.endDate) >= now);
      const primaryEndClientId = activeEndClient?.clientId || endClientAssignments[endClientAssignments.length - 1]?.clientId || '';

      const endVendorAssignments = (formData.endVendorAssignments as EmployeeEndVendorAssignment[] || []).filter((a) => a.vendorId);
      const activeEndVendor = endVendorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= now);
      const primaryEndVendorId = activeEndVendor?.vendorId || endVendorAssignments[endVendorAssignments.length - 1]?.vendorId || '';

      const subcontractorAssignments = (formData.subcontractorAssignments as EmployeeSubcontractorAssignment[] || []).filter((a) => a.subcontractorId);
      const activeSubcontractor = subcontractorAssignments.find((a) => !a.endDate || new Date(a.endDate) >= now);
      const primarySubcontractorId = activeSubcontractor?.subcontractorId || subcontractorAssignments[subcontractorAssignments.length - 1]?.subcontractorId || '';

      const employeeData = {
        ...formData,
        type: selectedType,
        clientAssignments,
        vendorAssignments,
        endClientAssignments,
        endVendorAssignments,
        subcontractorAssignments,
        clientId: primaryClientId || (formData.clientId as string) || '',
        vendorId: primaryVendorId || (formData.vendorId as string) || '',
        endClientId: primaryEndClientId || (formData.endClientId as string) || '',
        endVendorId: primaryEndVendorId || (formData.endVendorId as string) || '',
        subcontractorId: primarySubcontractorId || (formData.subcontractorId as string) || '',
      };

      const name = (formData.name as string | undefined) || 'Employee';

      if (mode === 'create') {
        await createEmployee(employeeData as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Employee created', `${name} has been added.`);
        router.push('/employees');
      } else if (initial) {
        await updateEmployee(initial.id, employeeData as Partial<Employee>);
        toast.success('Employee updated', `${name} has been saved.`);
        router.push(`/employees/${initial.id}`);
      }
    } catch (error) {
      console.error('Failed to save employee:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      toast.error(mode === 'create' ? 'Could not create employee' : 'Could not update employee', message);
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const baseInputClasses = cn(
      'w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none',
      'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
      errors[field.name]
        ? 'border-red-300 bg-red-50'
        : 'border-slate-200 bg-white text-slate-900'
    );

    switch (field.type) {
      case 'select': {
        const isLoadingData =
          (field.name === 'clientId' && clientsLoading) || (field.name === 'vendorId' && vendorsLoading);
        const hasNoData = field.options && field.options.length === 0;
        const selectKey =
          field.name === 'clientId'
            ? `${field.name}-${clients.length}`
            : field.name === 'vendorId'
            ? `${field.name}-${vendors.length}`
            : field.name;
        return (
          <select
            key={selectKey}
            value={String(value ?? '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={isLoadingData}
            className={baseInputClasses}
          >
            <option value="">
              {isLoadingData
                ? `Loading ${field.label.toLowerCase()}...`
                : hasNoData
                ? `No ${field.label.toLowerCase()} available`
                : `Select ${field.label}`}
            </option>
            {field.options?.map((option, index) => (
              <option key={option.value || `option-${index}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      case 'checkbox': {
        const on = Boolean(value);
        return (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => handleInputChange(field, !on)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors',
              on
                ? 'border-brand-300 bg-brand-50 text-brand-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <span>{on ? 'Yes' : 'No'}</span>
            <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-brand-600' : 'bg-slate-300')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </button>
        );
      }

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => handleInputChange(field, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            className={baseInputClasses}
            min="0"
            step={/pay|salary|rate/i.test(field.name) ? '0.01' : '1'}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={String(value ?? '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

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
      {errors[field.name] && <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Employee Type */}
      {mode === 'create' ? (
        <SectionCard title="Employee Type" description="Choose the category for this employee">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {employeeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setSelectedType(type.value);
                  setFormData({
                    type: type.value,
                    clientAssignments: [],
                    vendorAssignments: [],
                    endClientAssignments: [],
                    endVendorAssignments: [],
                    subcontractorAssignments: [],
                  });
                  setErrors({});
                }}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                  selectedType === type.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Employee Type" description="The category cannot be changed after creation">
          <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold', typeBadge[selectedType])}>
            {selectedType} Employee
          </span>
        </SectionCard>
      )}

      {/* Grouped scalar field sections */}
      {groupedSections.map((section) => (
        <SectionCard key={section.id} title={section.title} description={section.description}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.sectionFields.map(renderFieldCell)}
          </div>
        </SectionCard>
      ))}

      {otherFields.length > 0 && (
        <SectionCard title="Additional Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <AssignmentEditor
            title="Client Assignments"
            addLabel="Add Client"
            selectLabel="Client"
            emptyText='No clients added. Click "Add Client" to assign one.'
            accent="emerald"
            options={clients.filter((c) => c?.id && c?.name)}
            optionsLoading={clientsLoading}
            idKey="clientId"
            list={(formData.clientAssignments as EmployeeClientAssignment[]) || []}
            onChange={(list) => setFormData((prev) => ({ ...prev, clientAssignments: list }))}
          />
          <AssignmentEditor
            title="Vendor Assignments"
            addLabel="Add Vendor"
            selectLabel="Vendor"
            emptyText='No vendors added. Click "Add Vendor" to assign one.'
            accent="purple"
            options={vendors.filter((v) => v?.id && v?.name)}
            optionsLoading={vendorsLoading}
            idKey="vendorId"
            list={(formData.vendorAssignments as EmployeeVendorAssignment[]) || []}
            onChange={(list) => setFormData((prev) => ({ ...prev, vendorAssignments: list }))}
          />
          <AssignmentEditor
            title="End Client Assignments"
            addLabel="Add End Client"
            selectLabel="End Client"
            emptyText='No end clients added. Click "Add End Client" to assign one.'
            accent="sky"
            options={endClients.filter((c) => c?.id && c?.name)}
            optionsLoading={endClientsLoading}
            idKey="clientId"
            list={(formData.endClientAssignments as EmployeeEndClientAssignment[]) || []}
            onChange={(list) => setFormData((prev) => ({ ...prev, endClientAssignments: list }))}
          />
          <AssignmentEditor
            title="End Vendor Assignments"
            addLabel="Add End Vendor"
            selectLabel="End Vendor"
            emptyText='No end vendors added. Click "Add End Vendor" to assign one.'
            accent="amber"
            options={vendors.filter((v) => v?.id && v?.name)}
            optionsLoading={vendorsLoading}
            idKey="vendorId"
            list={(formData.endVendorAssignments as EmployeeEndVendorAssignment[]) || []}
            onChange={(list) => setFormData((prev) => ({ ...prev, endVendorAssignments: list }))}
          />
          <AssignmentEditor
            title="Subcontractor Assignments"
            addLabel="Add Subcontractor"
            selectLabel="Subcontractor"
            emptyText='No subcontractors added. Click "Add Subcontractor" to assign one.'
            accent="teal"
            options={subcontractors.filter((s) => s?.id && s?.name)}
            optionsLoading={subcontractorsLoading}
            idKey="subcontractorId"
            list={(formData.subcontractorAssignments as EmployeeSubcontractorAssignment[]) || []}
            onChange={(list) => setFormData((prev) => ({ ...prev, subcontractorAssignments: list }))}
          />
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-2">
        <button type="button" onClick={handleCancel} className="btn-ghost" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : mode === 'create' ? (
            'Add Employee'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}

type AssignmentRow = { startDate?: string; endDate?: string };

const accentStyles: Record<string, { addBtn: string; focus: string }> = {
  emerald: { addBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', focus: 'focus:border-emerald-500' },
  purple: { addBtn: 'bg-purple-50 text-purple-700 hover:bg-purple-100', focus: 'focus:border-purple-500' },
  sky: { addBtn: 'bg-sky-50 text-sky-700 hover:bg-sky-100', focus: 'focus:border-sky-500' },
  amber: { addBtn: 'bg-amber-50 text-amber-700 hover:bg-amber-100', focus: 'focus:border-amber-500' },
  teal: { addBtn: 'bg-teal-50 text-teal-700 hover:bg-teal-100', focus: 'focus:border-teal-500' },
};

/** A single assignment-kind editor (select + start/end dates + remove). */
function AssignmentEditor<T extends AssignmentRow>({
  title,
  addLabel,
  selectLabel,
  emptyText,
  accent,
  options,
  optionsLoading,
  idKey,
  list,
  onChange,
}: {
  title: string;
  addLabel: string;
  selectLabel: string;
  emptyText: string;
  accent: keyof typeof accentStyles;
  options: { id: string; name: string }[];
  optionsLoading: boolean;
  idKey: string;
  list: T[];
  onChange: (list: T[]) => void;
}) {
  const styles = accentStyles[accent];
  const inputClasses = cn(
    'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none',
    styles.focus
  );

  const setRow = (idx: number, patch: Partial<T>) => {
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{list.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange([...list, { [idKey]: '', startDate: '', endDate: '' } as unknown as T])}
          className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', styles.addBtn)}
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
            {emptyText}
          </p>
        ) : (
          list.map((assignment, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{selectLabel}</label>
                  <select
                    value={((assignment as Record<string, string | undefined>)[idKey]) || ''}
                    onChange={(e) => setRow(idx, { [idKey]: e.target.value } as Partial<T>)}
                    disabled={optionsLoading}
                    className={inputClasses}
                  >
                    <option value="">{optionsLoading ? 'Loading...' : `Select ${selectLabel}`}</option>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={assignment.startDate || ''}
                    onChange={(e) => setRow(idx, { startDate: e.target.value } as Partial<T>)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={assignment.endDate || ''}
                    onChange={(e) => setRow(idx, { endDate: e.target.value } as Partial<T>)}
                    className={inputClasses}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChange(list.filter((_, i) => i !== idx))}
                className="mt-5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
