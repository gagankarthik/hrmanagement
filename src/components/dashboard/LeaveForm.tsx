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

const field =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

function initialForm(mode: 'create' | 'edit', initial?: Leave): LeaveFormData {
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
  return { employeeId: '', type: 'Sick', startDate: '', endDate: '', reason: '', documents: [] };
}

/**
 * Dedicated (non-dialog) leave create/edit form. Rendered inside a FormPageShell
 * on /dashboard/leaves/new and /dashboard/leaves/[id]/edit.
 */
export function LeaveForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Leave }) {
  const router = useRouter();
  const { createLeave, updateLeave } = useLeaves();
  const { employees } = useEmployees();
  const toast = useToast();

  const [form, setForm] = useState<LeaveFormData>(() => initialForm(mode, initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof LeaveFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const cancel = () => {
    if (mode === 'edit' && initial) router.push(`/dashboard/leaves/${initial.id}`);
    else router.push('/dashboard/leaves');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.employeeId) nextErrors.employeeId = 'Please select an employee';
    if (!form.startDate) nextErrors.startDate = 'Start date is required';
    if (!form.endDate) nextErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) nextErrors.endDate = 'End date must be after start date';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const employeeName = employees.find((emp) => emp.id === form.employeeId)?.name || 'Employee';
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createLeave(form);
        toast.success('Leave request created', `Request for ${employeeName} has been added.`);
        router.push('/dashboard/leaves');
      } else {
        await updateLeave(initial!.id, form);
        toast.success('Leave request updated', `Request for ${employeeName} has been saved.`);
        router.push(`/dashboard/leaves/${initial!.id}`);
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

      <div>
        <label className={label}>Employee <span className="text-red-500">*</span></label>
        <Combobox
          value={form.employeeId}
          onChange={(v) => set('employeeId', v)}
          options={employees.map((e) => ({ value: e.id, label: e.name, sublabel: e.type }))}
          placeholder="Select an employee…"
          className={cn(errors.employeeId && '[&>button]:border-red-300 [&>button]:focus:border-red-400 [&>button]:focus:ring-red-50')}
        />
        {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>}
      </div>

      <div>
        <label className={label}>Leave Type <span className="text-red-500">*</span></label>
        <select value={form.type} onChange={(e) => set('type', e.target.value as LeaveType)} className={field}>
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Start Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)}
            className={cn(field, errors.startDate && 'border-red-300 focus:border-red-400 focus:ring-red-50')} />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
        </div>
        <div>
          <label className={label}>End Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)}
            className={cn(field, errors.endDate && 'border-red-300 focus:border-red-400 focus:ring-red-50')} />
          {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <div>
        <label className={label}>Reason</label>
        <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} placeholder="Optional note for this request" className={cn(field, 'resize-none')} />
      </div>

      <DocumentUploader
        label="Supporting documents"
        folder="leaves"
        value={form.documents}
        onChange={(docs: UploadedDoc[]) => setForm((p) => ({ ...p, documents: docs }))}
      />

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" onClick={cancel} disabled={submitting} className="btn-ghost disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : mode === 'create' ? 'Submit Request' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default LeaveForm;
