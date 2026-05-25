'use client';

import React, { useState, useEffect } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaves } from '@/context/LeaveContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Leave, LeaveFormData, LeaveType, LEAVE_TYPES } from '@/types/leave';
import { UploadedDoc } from '@/types/uploads';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { useToast } from '@/components/ui/toast';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

export default function LeaveModal({ isOpen, onClose, mode, leave }: {
  isOpen: boolean; onClose: () => void; mode: 'create' | 'edit'; leave?: Leave;
}) {
  const { createLeave, updateLeave } = useLeaves();
  const { employees } = useEmployees();
  const toast = useToast();
  const [form, setForm] = useState<LeaveFormData>({ employeeId: '', type: 'Sick', startDate: '', endDate: '', reason: '', documents: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(mode === 'edit' && leave
      ? { employeeId: leave.employeeId, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason || '', documents: leave.documents || [] }
      : { employeeId: '', type: 'Sick', startDate: '', endDate: '', reason: '', documents: [] }
    );
    setErrors({});
  }, [mode, leave, isOpen]);

  const set = (k: keyof LeaveFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
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
      } else {
        await updateLeave(leave!.id, form);
        toast.success('Leave request updated', `Request for ${employeeName} has been saved.`);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not create leave request' : 'Could not update leave request', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <CalendarDays className="h-4.5 w-4.5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">
              {mode === 'create' ? 'Apply for Leave' : 'Edit Leave Request'}
            </h2>
            <p className="text-xs text-slate-400">{mode === 'create' ? 'Submit a new leave request' : 'Update leave request details'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {errors._ && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>}

          <div>
            <label className={label}>Employee <span className="text-red-500">*</span></label>
            <select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}
              className={cn(field, errors.employeeId && 'border-red-300 focus:border-red-400 focus:ring-red-50')}>
              <option value="">Select an employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
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
            <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={2} placeholder="Optional note for this request" className={cn(field, 'resize-none')} />
          </div>

          <DocumentUploader
            label="Supporting documents"
            folder="leaves"
            value={form.documents}
            onChange={(docs: UploadedDoc[]) => setForm((p) => ({ ...p, documents: docs }))}
          />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-ghost disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : mode === 'create' ? 'Submit Request' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
