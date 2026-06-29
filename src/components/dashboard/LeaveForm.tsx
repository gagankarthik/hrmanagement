'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Leave, LeaveFormData, LeaveType, LEAVE_TYPES } from '@/types/leave';
import { UploadedDoc } from '@/types/uploads';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { useToast } from '@/components/ui/toast';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';

/** Identity of a user filing leave for themselves (ESS). `employeeId` is
 *  optional — recruiter / sales users may have no employee record. */
export type SelfApply = { employeeId?: string; name: string; email: string };

function initialForm(mode: 'create' | 'edit', initial?: Leave, selfApply?: SelfApply): LeaveFormData {
  if (mode === 'edit' && initial) {
    return {
      employeeId: initial.employeeId,
      type: initial.type,
      startDate: initial.startDate,
      endDate: initial.endDate,
      reason: initial.reason || '',
      documents: initial.documents || [],
    };
  }
  return {
    employeeId: selfApply?.employeeId || '',
    type: 'Sick',
    startDate: '',
    endDate: '',
    reason: '',
    documents: [],
    ...(selfApply ? { requesterEmail: selfApply.email, requesterName: selfApply.name } : {}),
  };
}

/**
 * Dedicated (non-dialog) leave create/edit form. Rendered inside a FormPageShell
 * on /leaves/new and /leaves/[id]/edit.
 *
 * `selfApply` binds the request to the signed-in user and hides the employee
 * picker — used by the self-service portal so recruiter/sales users can only
 * file leave for themselves (and works even when they have no employee record).
 * `redirectTo` overrides where the form navigates after submit/cancel
 * (defaults to the admin /leaves list).
 */
export function LeaveForm({
  mode,
  initial,
  selfApply,
  redirectTo = '/leaves',
}: {
  mode: 'create' | 'edit';
  initial?: Leave;
  selfApply?: SelfApply;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { createLeave, updateLeave } = useLeaves();
  const { employees } = useEmployees();
  const toast = useToast();

  const [form, setForm] = useState<LeaveFormData>(() => initialForm(mode, initial, selfApply));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof LeaveFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/leaves/${initial.id}`);
    else router.push(redirectTo);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    // ESS users have no picker — their identity is fixed, so don't require employeeId.
    if (!selfApply && !form.employeeId) nextErrors.employeeId = 'Please select an employee';
    if (!form.startDate) nextErrors.startDate = 'Start date is required';
    if (!form.endDate) nextErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) nextErrors.endDate = 'End date must be after start date';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const employeeName = selfApply?.name || employees.find((emp) => emp.id === form.employeeId)?.name || 'Employee';
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createLeave(form);
        toast.success('Leave request created', `Request for ${employeeName} has been added.`);
        router.push(redirectTo);
      } else {
        await updateLeave(initial!.id, form);
        toast.success('Leave request updated', `Request for ${employeeName} has been saved.`);
        router.push(`/leaves/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create leave request' : 'Could not update leave request', message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface space-y-5 p-5 sm:p-6">
      {errors._ && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>}

      <FormField label="Employee" required error={selfApply ? undefined : errors.employeeId}>
        {selfApply ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
              {(selfApply.name || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-800">{selfApply.name}</span>
              <span className="block truncate text-xs text-slate-400">{selfApply.email}</span>
            </div>
          </div>
        ) : (
          <Combobox
            value={form.employeeId}
            onChange={(v) => set('employeeId', v)}
            options={employees.map((e) => ({ value: e.id, label: e.name, sublabel: e.type }))}
            placeholder="Select an employee…"
            className={cn(errors.employeeId && '[&>button]:border-red-300 [&>button]:focus:border-red-400 [&>button]:focus:ring-red-50')}
          />
        )}
      </FormField>

      <FormField label="Leave Type" required>
        <NativeSelect value={form.type} onChange={(e) => set('type', e.target.value as LeaveType)}>
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Start Date" required error={errors.startDate}>
          <Input type="date" invalid={!!errors.startDate} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="End Date" required error={errors.endDate}>
          <Input type="date" invalid={!!errors.endDate} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </FormField>
      </div>

      <FormField label="Reason">
        <Textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} placeholder="Optional note for this request" className="resize-none" />
      </FormField>

      <DocumentUploader
        label="Supporting documents"
        folder="leaves"
        value={form.documents}
        onChange={(docs: UploadedDoc[]) => setForm((p) => ({ ...p, documents: docs }))}
      />

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={cancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Submit Request' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

export default LeaveForm;
