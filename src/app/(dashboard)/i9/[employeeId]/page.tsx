'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Save, Loader2, ShieldCheck, FileCheck2, UserCheck, History, FolderArchive, Info, Plus, Trash2, ListChecks, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEmployees } from '@/context/EmployeeContext';
import { useI9 } from '@/context/I9Context';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  I9Record, I9AuditEvent, WorkAuthEntry, EVERIFY_STATUSES, CITIZENSHIP_STATUSES,
  deriveI9Status, i9RetentionDate,
} from '@/types/i9';
import type { UploadedDoc } from '@/types/uploads';
import { WORK_AUTHORIZATION_OPTIONS, type Employee } from '@/types/employee';

const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';
const fmt = (d?: Date | null) => (d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

function Card({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function I9RecordPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const router = useRouter();
  const { getEmployeeById } = useEmployees();
  const { getByEmployee, saveRecord, deleteRecord, isLoading } = useI9();
  const { user } = useAuth();
  const toast = useToast();

  const emp = getEmployeeById(employeeId) as Employee | undefined;
  const rec = getByEmployee(employeeId);

  const [form, setForm] = useState<Partial<I9Record>>({ everifyStatus: 'Not submitted' });
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [authHistory, setAuthHistory] = useState<WorkAuthEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (rec) {
      setForm(rec);
      setDocs(rec.documents || []);
      setAuthHistory(rec.workAuthHistory || []);
      setHydrated(true);
    } else if (!isLoading) {
      setForm({ everifyStatus: 'Not submitted', documentExpiry: emp && 'expiryDate' in emp ? (emp as { expiryDate?: string }).expiryDate : undefined });
      setHydrated(true);
    }
  }, [rec, isLoading, hydrated, emp]);

  const set = (k: keyof I9Record, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const addAuth = () => setAuthHistory((p) => [...p, { id: uuidv4(), type: '', status: 'Current' }]);
  const updateAuth = (id: string, field: keyof WorkAuthEntry, v: string) => setAuthHistory((p) => p.map((a) => (a.id === id ? { ...a, [field]: v } : a)));
  const removeAuth = (id: string) => setAuthHistory((p) => p.filter((a) => a.id !== id));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecord(employeeId);
      toast.success('I-9 record deleted');
      router.push('/i9');
    } catch (err) {
      toast.error('Could not delete', err instanceof Error ? err.message : 'Please try again.');
      setDeleting(false);
      setDelConfirm(false);
    }
  };
  const status = deriveI9Status({ ...form, documents: docs });
  const retain = i9RetentionDate(emp?.hireDate, emp && 'dor' in emp ? (emp as { dor?: string }).dor : undefined);

  const save = async () => {
    setSaving(true);
    try {
      const nowISO = new Date().toISOString();
      const by = user?.name || user?.email;
      const newStatus = deriveI9Status({ ...form, documents: docs });
      const events: I9AuditEvent[] = [];
      if (!rec) events.push({ at: nowISO, action: 'I-9 record created', by });
      if ((rec?.status || 'Not started') !== newStatus) events.push({ at: nowISO, action: `Status → ${newStatus}`, by });
      if ((rec?.everifyStatus || 'Not submitted') !== (form.everifyStatus || 'Not submitted')) events.push({ at: nowISO, action: `E-Verify → ${form.everifyStatus}${form.everifyCaseNumber ? ` (#${form.everifyCaseNumber})` : ''}`, by });
      if (!rec?.repName && form.repName) events.push({ at: nowISO, action: `Authorized representative assigned: ${form.repName}`, by });
      if ((docs.length || 0) > (rec?.documents?.length || 0)) events.push({ at: nowISO, action: 'Work-authorization document(s) added', by });
      if (events.length === 0) events.push({ at: nowISO, action: 'Record updated', by });

      const record: Partial<I9Record> & { employeeId: string } = {
        ...form,
        employeeId,
        employeeName: emp?.name || '',
        documents: docs,
        workAuthHistory: authHistory,
        everifyStatus: form.everifyStatus || 'Not submitted',
        status: newStatus,
        auditTrail: [...events, ...(rec?.auditTrail || [])].slice(0, 100),
      };
      await saveRecord(record);
      toast.success('I-9 saved', `${emp?.name || 'Employee'} · ${newStatus}`);
    } catch (err) {
      toast.error('Could not save I-9', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!emp && !isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button onClick={() => router.push('/i9')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to Form I-9</button>
        <div className="surface p-10 text-center text-sm text-slate-500">Employee not found.</div>
      </div>
    );
  }

  const statusTone = status === 'E-Verified' || status === 'Verified' ? 'emerald' : status === 'Not started' ? 'slate' : 'amber';

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/i9')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to Form I-9
      </button>

      <PageHeader
        icon={BadgeCheck}
        eyebrow="Form I-9"
        title={emp?.name || 'Employee'}
        description={`${emp?.type || ''} · employment eligibility verification`}
        tone="brand"
        actions={
          <div className="flex items-center gap-2">
            {rec && (
              <a href={`/api/i9/${employeeId}/pdf`} target="_blank" rel="noreferrer" className="btn-ghost" title="Download a pre-filled official Form I-9">
                <Download className="h-4 w-4" strokeWidth={1.75} /> Download I-9
              </a>
            )}
            <span className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1', statusTone === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : statusTone === 'amber' ? 'bg-accent-50 text-accent-700 ring-accent-200' : 'bg-slate-100 text-slate-500 ring-slate-200')}>{status}</span>
          </div>
        }
      />

      {/* Retention banner */}
      <div className="surface flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm text-slate-600"><FolderArchive className="h-4 w-4 text-brand-600" strokeWidth={1.75} /> Retain this record until <span className="font-semibold text-slate-900">{fmt(retain)}</span></span>
        <span className="text-xs text-slate-400">Later of 3 years after hire or 1 year after termination</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card icon={UserCheck} title="Section 1 · Employee" subtitle="Citizenship / immigration status the employee attests to">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Citizenship status</label>
                <select value={form.citizenshipStatus || ''} onChange={(e) => set('citizenshipStatus', e.target.value || undefined)} className={input}>
                  <option value="">Select…</option>
                  {CITIZENSHIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>A-Number / USCIS number</label>
                <input value={form.alienNumber || ''} onChange={(e) => set('alienNumber', e.target.value)} placeholder="If applicable" className={input} />
              </div>
              <div>
                <label className={label}>Section 1 completed</label>
                <input type="date" value={form.section1Date || ''} onChange={(e) => set('section1Date', e.target.value)} className={input} />
              </div>
            </div>
          </Card>

          <Card icon={FileCheck2} title="Section 2 · Document verification" subtitle="Identity & employment-authorization documents reviewed">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Document(s) presented</label>
                <input value={form.documentTitle || ''} onChange={(e) => set('documentTitle', e.target.value)} placeholder="e.g. U.S. Passport, or Driver's License + SS Card" className={input} />
              </div>
              <div>
                <label className={label}>Issuing authority</label>
                <input value={form.issuingAuthority || ''} onChange={(e) => set('issuingAuthority', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Document number</label>
                <input value={form.documentNumber || ''} onChange={(e) => set('documentNumber', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Document expiration</label>
                <input type="date" value={form.documentExpiry || ''} onChange={(e) => set('documentExpiry', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Verified on</label>
                <input type="date" value={form.section2Date || ''} onChange={(e) => set('section2Date', e.target.value)} className={input} />
              </div>
            </div>
          </Card>

          <Card icon={UserCheck} title="Authorized representative" subtitle="For remote hires — who verified the original documents in person">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Representative name</label>
                <input value={form.repName || ''} onChange={(e) => set('repName', e.target.value)} placeholder="Full name" className={input} />
              </div>
              <div>
                <label className={label}>Representative email</label>
                <input type="email" value={form.repEmail || ''} onChange={(e) => set('repEmail', e.target.value)} placeholder="rep@email.com" className={input} />
              </div>
              <div>
                <label className={label}>Title / relationship</label>
                <input value={form.repTitle || ''} onChange={(e) => set('repTitle', e.target.value)} placeholder="e.g. Notary, Manager" className={input} />
              </div>
              <div>
                <label className={label}>Assigned on</label>
                <input type="date" value={form.repAssignedDate || ''} onChange={(e) => set('repAssignedDate', e.target.value)} className={input} />
              </div>
            </div>
          </Card>

          <Card icon={ShieldCheck} title="E-Verify" subtitle="Case tracking">
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" strokeWidth={1.75} />
              Record the result of your E-Verify case here. This tracks status for audits — it does not submit to DHS.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>E-Verify status</label>
                <select value={form.everifyStatus || 'Not submitted'} onChange={(e) => set('everifyStatus', e.target.value)} className={input}>
                  {EVERIFY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Case number</label>
                <input value={form.everifyCaseNumber || ''} onChange={(e) => set('everifyCaseNumber', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Case date</label>
                <input type="date" value={form.everifyDate || ''} onChange={(e) => set('everifyDate', e.target.value)} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Notes</label>
                <input value={form.everifyNotes || ''} onChange={(e) => set('everifyNotes', e.target.value)} placeholder="Optional" className={input} />
              </div>
            </div>
          </Card>

          <Card icon={ListChecks} title="Work authorization history" subtitle="Current and past authorizations on file">
            {authHistory.length > 0 && (
              <>
                <div className="mb-1 hidden grid-cols-12 gap-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:grid">
                  <span className="col-span-3">Authorization</span><span className="col-span-2">Number</span><span className="col-span-2">Issued</span><span className="col-span-2">Expiry</span><span className="col-span-2">Status</span><span className="col-span-1" />
                </div>
                <div className="space-y-2.5">
                  {authHistory.map((a) => (
                    <div key={a.id} className="grid items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:grid-cols-12">
                      <select value={a.type} onChange={(e) => updateAuth(a.id, 'type', e.target.value)} className={cn(input, 'sm:col-span-3')}>
                        <option value="">Type…</option>
                        {WORK_AUTHORIZATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input value={a.number || ''} onChange={(e) => updateAuth(a.id, 'number', e.target.value)} placeholder="Number" className={cn(input, 'sm:col-span-2')} />
                      <input type="date" value={a.issued || ''} onChange={(e) => updateAuth(a.id, 'issued', e.target.value)} className={cn(input, 'sm:col-span-2')} />
                      <input type="date" value={a.expiry || ''} onChange={(e) => updateAuth(a.id, 'expiry', e.target.value)} className={cn(input, 'sm:col-span-2')} />
                      <select value={a.status || 'Current'} onChange={(e) => updateAuth(a.id, 'status', e.target.value)} className={cn(input, 'sm:col-span-2')}>
                        <option value="Current">Current</option><option value="Expired">Expired</option><option value="Superseded">Superseded</option>
                      </select>
                      <button type="button" onClick={() => removeAuth(a.id)} className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:col-span-1" aria-label="Remove"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button type="button" onClick={addAuth} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <Plus className="h-4 w-4" strokeWidth={1.75} /> Add authorization
            </button>
          </Card>

          <Card icon={FolderArchive} title="Work-authorization documents" subtitle="Collect & retain copies — works for US I-9 and global work permits/visas">
            <DocumentUploader value={docs} onChange={setDocs} folder={`i9/${employeeId}`} label="" />
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {rec && (
                <button onClick={() => setDelConfirm(true)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} /> Delete I-9 record
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => router.push('/i9')} className="btn-ghost">Cancel</button>
              <button onClick={save} disabled={saving || !hydrated} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Save className="h-4 w-4" strokeWidth={1.75} />} Save I-9
              </button>
            </div>
          </div>

          <ConfirmDialog
            isOpen={delConfirm}
            onClose={() => setDelConfirm(false)}
            onConfirm={handleDelete}
            title="Delete I-9 record"
            description={<>Delete the I-9 record for <span className="font-semibold text-slate-900">{emp?.name || 'this employee'}</span>? This removes the digital I-9, its documents list, and audit trail. This cannot be undone.</>}
            confirmLabel="Delete record"
            isLoading={deleting}
          />
        </div>

        {/* Audit trail */}
        <div className="lg:col-span-1">
          <div className="surface p-5 lg:sticky lg:top-20">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100"><History className="h-4 w-4" strokeWidth={1.75} /></span>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Audit trail</h2>
                <p className="text-xs text-slate-500">For DOL audits & FDNS visits</p>
              </div>
            </div>
            {(rec?.auditTrail?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No history yet. Saving records each change here.</p>
            ) : (
              <ol className="space-y-3">
                {rec!.auditTrail.map((ev, i) => (
                  <li key={i} className="relative border-l-2 border-slate-100 pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-400" />
                    <p className="text-sm font-medium text-slate-800">{ev.action}</p>
                    <p className="text-[11px] text-slate-400">{new Date(ev.at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{ev.by ? ` · ${ev.by}` : ''}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
