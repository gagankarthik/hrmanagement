'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useTimesheets } from '@/context/TimesheetContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';
import { Timesheet, TimesheetStatus, TIMESHEET_STATUSES } from '@/types/timesheet';
import type { Employee } from '@/types/employee';

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TimesheetForm({ mode, timesheet }: { mode: 'create' | 'edit'; timesheet?: Timesheet }) {
  const router = useRouter();
  const { employees } = useEmployees();
  const { clients } = useClients();
  const { createTimesheet, updateTimesheet } = useTimesheets();
  const toast = useToast();

  const [employeeId, setEmployeeId] = useState(timesheet?.employeeId ?? '');
  const [clientId, setClientId] = useState(timesheet?.clientId ?? '');
  const [periodStart, setPeriodStart] = useState(timesheet?.periodStart ?? todayISO());
  const [periodEnd, setPeriodEnd] = useState(timesheet?.periodEnd ?? todayISO());
  const [hours, setHours] = useState(String(timesheet?.hours ?? 40));
  const [billRate, setBillRate] = useState(String(timesheet?.billRate ?? ''));
  const [payRate, setPayRate] = useState(String(timesheet?.payRate ?? ''));
  const [status, setStatus] = useState<TimesheetStatus>(timesheet?.status ?? 'Draft');
  const [notes, setNotes] = useState(timesheet?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const onEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id) as Employee | undefined;
    if (!emp) return;
    // Prefill from the worker's defaults when fields are still empty (create flow).
    if (mode === 'create') {
      if (emp.billRate != null && !billRate) setBillRate(String(emp.billRate));
      if (emp.payRate != null && !payRate) setPayRate(String(emp.payRate));
      const cid = emp.clientId || emp.clientAssignments?.[0]?.clientId;
      if (cid && !clientId) setClientId(cid);
    }
  };

  const hrs = Number(hours) || 0;
  const bill = Number(billRate) || 0;
  const pay = Number(payRate) || 0;
  const billTotal = bill * hrs;
  const gp = (bill - pay) * hrs;

  const employeeName = useMemo(() => employees.find((e) => e.id === employeeId)?.name ?? '', [employees, employeeId]);
  const clientName = useMemo(() => clients.find((c) => c.id === clientId)?.name ?? '', [clients, clientId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Pick a worker', 'Select who these hours are for.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employeeId,
        employeeName,
        clientId,
        clientName,
        periodStart,
        periodEnd,
        hours: hrs,
        billRate: bill,
        payRate: pay,
        status,
        notes,
      };
      if (mode === 'create') {
        await createTimesheet(payload);
        toast.success('Timesheet added', `${employeeName || 'Worker'} · ${hrs}h`);
      } else if (timesheet) {
        await updateTimesheet(timesheet.id, payload);
        toast.success('Timesheet updated', `${employeeName || 'Worker'} · ${hrs}h`);
      }
      router.push('/timesheets');
    } catch (err) {
      toast.error('Could not save timesheet', err instanceof Error ? err.message : 'Please try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Worker" required>
          <NativeSelect value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)}>
            <option value="">Select a worker…</option>
            {employees.filter((e) => e && e.id).map((e) => (
              <option key={e.id} value={e.id}>{e.name || 'Unnamed'} · {e.type}</option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Client">
          <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">No client</option>
            {clients.filter((c) => c && c.id).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Period start">
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </FormField>
        <FormField label="Period end">
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </FormField>
        <FormField label="Hours">
          <Input type="number" min={0} step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
        </FormField>
        <FormField label="Status">
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as TimesheetStatus)}>
            {TIMESHEET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </NativeSelect>
        </FormField>
        <FormField label="Bill rate ($/hr)">
          <Input type="number" min={0} step="0.01" value={billRate} onChange={(e) => setBillRate(e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Pay rate ($/hr)">
          <Input type="number" min={0} step="0.01" value={payRate} onChange={(e) => setPayRate(e.target.value)} placeholder="0.00" />
        </FormField>
      </div>

      <FormField label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes…" />
      </FormField>

      {/* Computed preview */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bill total</p>
          <p className="font-display text-lg font-bold text-slate-900">{usd0(billTotal)}</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Gross profit</p>
          <p className="font-display text-lg font-bold text-emerald-700">{usd0(gp)}</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Margin</p>
          <p className="font-display text-lg font-bold text-slate-900">{bill > 0 ? `${(((bill - pay) / bill) * 100).toFixed(1)}%` : '—'}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="ghost" onClick={() => router.push('/timesheets')}>Cancel</Button>
        <Button type="submit" loading={saving}>
          {!saving && <Save className="h-4 w-4" strokeWidth={1.75} />}
          {mode === 'create' ? 'Add timesheet' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
