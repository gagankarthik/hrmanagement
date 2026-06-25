'use client';

import React, { useState, useEffect } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Attendance, AttendanceFormData, AttendanceStatus } from '@/types/attendance';
import { useToast } from '@/components/ui/toast';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';

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

          <FormField label="Employee" required error={errors.employeeId}>
            <Combobox
              value={form.employeeId}
              onChange={(v) => set('employeeId', v)}
              options={employees.map((e) => ({ value: e.id, label: e.name, sublabel: e.type }))}
              placeholder="Select an employee…"
              className={cn(errors.employeeId && '[&>button]:border-red-300 [&>button]:focus:border-red-400 [&>button]:focus:ring-red-50')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Date" required error={errors.date}>
              <Input type="date" invalid={!!errors.date} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </FormField>
            <FormField label="Status">
              <NativeSelect value={form.status} onChange={(e) => set('status', e.target.value as AttendanceStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Check-in">
              <Input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} />
            </FormField>
            <FormField label="Check-out">
              <Input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Note">
            <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} placeholder="Optional note" className="resize-none" />
          </FormField>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Mark Attendance' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
