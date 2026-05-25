'use client';

import React, { useState, useEffect } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Attendance, AttendanceFormData, AttendanceStatus } from '@/types/attendance';
import { useToast } from '@/components/ui/toast';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Remote', 'Half-day', 'Absent', 'Leave'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceModal({ isOpen, onClose, mode, attendance }: {
  isOpen: boolean; onClose: () => void; mode: 'create' | 'edit'; attendance?: Attendance;
}) {
  const { createAttendance, updateAttendance } = useAttendance();
  const { employees } = useEmployees();
  const toast = useToast();
  const [form, setForm] = useState<AttendanceFormData>({ employeeId: '', date: todayISO(), status: 'Present', checkIn: '', checkOut: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(mode === 'edit' && attendance
      ? { employeeId: attendance.employeeId, date: attendance.date, status: attendance.status, checkIn: attendance.checkIn || '', checkOut: attendance.checkOut || '', note: attendance.note || '' }
      : { employeeId: '', date: todayISO(), status: 'Present', checkIn: '', checkOut: '', note: '' }
    );
    setErrors({});
  }, [mode, attendance, isOpen]);

  const set = (k: keyof AttendanceFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.date) nextErrors.date = 'Date is required';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const employeeName = employees.find((emp) => emp.id === form.employeeId)?.name || 'Employee';
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createAttendance(form);
        toast.success('Attendance recorded', `${employeeName} marked ${form.status}.`);
      } else {
        await updateAttendance(attendance!.id, form);
        toast.success('Attendance updated', `${employeeName}'s record has been saved.`);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not record attendance' : 'Could not update attendance', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <CalendarCheck className="h-4.5 w-4.5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">
              {mode === 'create' ? 'Mark Attendance' : 'Edit Attendance'}
            </h2>
            <p className="text-xs text-slate-400">{mode === 'create' ? 'Record a daily attendance entry' : 'Update attendance details'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className={cn(field, errors.date && 'border-red-300 focus:border-red-400 focus:ring-red-50')} />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as AttendanceStatus)} className={field}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Check-in</label>
              <input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Check-out</label>
              <input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={label}>Note</label>
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} placeholder="Optional note" className={cn(field, 'resize-none')} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-ghost disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : mode === 'create' ? 'Mark Attendance' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
