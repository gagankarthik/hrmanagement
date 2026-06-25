'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, GraduationCap, Save, Loader2, Building2, UserCheck, CalendarClock,
  GitCompareArrows, FolderArchive, History, Plus, Trash2, Info, Download,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEmployees } from '@/context/EmployeeContext';
import { useI983 } from '@/context/I983Context';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  I983Record, I983MaterialChange, I983Evaluation, I983AuditEvent,
  deriveI983Status, nextEvaluationDue,
} from '@/types/i983';
import type { UploadedDoc } from '@/types/uploads';
import type { Employee } from '@/types/employee';

const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

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

function EvalBlock({ title, value, onChange }: { title: string; value: I983Evaluation; onChange: (v: I983Evaluation) => void }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input type="checkbox" checked={!!value.done} onChange={(e) => onChange({ ...value, done: e.target.checked, completedDate: e.target.checked ? value.completedDate || new Date().toISOString().slice(0, 10) : value.completedDate })} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
          Completed
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Due date</label>
          <input type="date" value={value.dueDate || ''} onChange={(e) => onChange({ ...value, dueDate: e.target.value })} className={input} />
        </div>
        <div>
          <label className={label}>Completed date</label>
          <input type="date" value={value.completedDate || ''} onChange={(e) => onChange({ ...value, completedDate: e.target.value })} className={input} />
        </div>
      </div>
    </div>
  );
}

export default function I983RecordPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const router = useRouter();
  const { getEmployeeById } = useEmployees();
  const { getByEmployee, saveRecord, deleteRecord, isLoading } = useI983();
  const { user } = useAuth();
  const toast = useToast();

  const emp = getEmployeeById(employeeId) as Employee | undefined;
  const rec = getByEmployee(employeeId);

  const [form, setForm] = useState<Partial<I983Record>>({});
  const [eval12, setEval12] = useState<I983Evaluation>({});
  const [eval24, setEval24] = useState<I983Evaluation>({});
  const [changes, setChanges] = useState<I983MaterialChange[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (rec) {
      setForm(rec);
      setEval12(rec.eval12 || {});
      setEval24(rec.eval24 || {});
      setChanges(rec.materialChanges || []);
      setDocs(rec.documents || []);
      setHydrated(true);
    } else if (!isLoading) {
      setForm({ employerName: 'Ocean Blue', jobTitle: emp && 'position' in emp ? (emp as { position?: string }).position : undefined });
      setHydrated(true);
    }
  }, [rec, isLoading, hydrated, emp]);

  const set = (k: keyof I983Record, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const addChange = () => setChanges((p) => [...p, { id: uuidv4(), description: '', date: new Date().toISOString().slice(0, 10) }]);
  const updateChange = (id: string, field: keyof I983MaterialChange, v: string) => setChanges((p) => p.map((c) => (c.id === id ? { ...c, [field]: v } : c)));
  const removeChange = (id: string) => setChanges((p) => p.filter((c) => c.id !== id));

  const status = deriveI983Status({ trainingStartDate: form.trainingStartDate, eval12, eval24 });
  const due = nextEvaluationDue({ trainingStartDate: form.trainingStartDate, eval12, eval24 });

  const save = async () => {
    setSaving(true);
    try {
      const nowISO = new Date().toISOString();
      const by = user?.name || user?.email;
      const newStatus = deriveI983Status({ trainingStartDate: form.trainingStartDate, eval12, eval24 });
      const events: I983AuditEvent[] = [];
      if (!rec) events.push({ at: nowISO, action: 'I-983 plan created', by });
      if ((rec?.status || 'Draft') !== newStatus) events.push({ at: nowISO, action: `Status → ${newStatus}`, by });
      if (eval12.done && !rec?.eval12?.done) events.push({ at: nowISO, action: '12-month evaluation completed', by });
      if (eval24.done && !rec?.eval24?.done) events.push({ at: nowISO, action: '24-month evaluation completed', by });
      if (changes.length > (rec?.materialChanges?.length || 0)) events.push({ at: nowISO, action: 'Material change logged', by });
      if (docs.length > (rec?.documents?.length || 0)) events.push({ at: nowISO, action: 'Document(s) added', by });
      if (events.length === 0) events.push({ at: nowISO, action: 'Record updated', by });

      const record: Partial<I983Record> & { employeeId: string } = {
        ...form,
        employeeId,
        employeeName: emp?.name || '',
        eval12,
        eval24,
        materialChanges: changes,
        documents: docs,
        status: newStatus,
        auditTrail: [...events, ...(rec?.auditTrail || [])].slice(0, 100),
      };
      await saveRecord(record);
      toast.success('I-983 saved', `${emp?.name || 'Employee'} · ${newStatus}`);
    } catch (err) {
      toast.error('Could not save I-983', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecord(employeeId);
      toast.success('I-983 plan deleted');
      router.push('/i983');
    } catch (err) {
      toast.error('Could not delete', err instanceof Error ? err.message : 'Please try again.');
      setDeleting(false);
      setDelConfirm(false);
    }
  };

  if (!emp && !isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button onClick={() => router.push('/i983')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to Form I-983</button>
        <div className="surface p-10 text-center text-sm text-slate-500">Employee not found.</div>
      </div>
    );
  }

  const statusTone = status === 'Completed' ? 'emerald' : status === 'Active' ? 'amber' : 'slate';

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/i983')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to Form I-983
      </button>

      <PageHeader
        icon={GraduationCap}
        eyebrow="Form I-983 · STEM OPT"
        title={emp?.name || 'Employee'}
        description={`${emp?.type || ''} · training plan & evaluations`}
        tone="brand"
        actions={
          <div className="flex items-center gap-2">
            {rec && (
              <a href={`/api/i983/${employeeId}/pdf`} target="_blank" rel="noreferrer" className="btn-ghost">
                <Download className="h-4 w-4" strokeWidth={1.75} /> Download PDF
              </a>
            )}
            <span className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1', statusTone === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : statusTone === 'amber' ? 'bg-accent-50 text-accent-700 ring-accent-200' : 'bg-slate-100 text-slate-500 ring-slate-200')}>{status}</span>
          </div>
        }
      />

      {/* Evaluation reminder banner */}
      {due && (
        <div className={cn('surface flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between', due.overdue && 'ring-2 ring-red-200')}>
          <span className="flex items-center gap-2 text-sm text-slate-700">
            <CalendarClock className={cn('h-4 w-4', due.overdue ? 'text-red-500' : 'text-accent-600')} strokeWidth={1.75} />
            Next: <span className="font-semibold text-slate-900">{due.label}</span>
            {due.dueDate ? <> due {new Date(due.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</> : ' — set a training start date'}
          </span>
          {due.dueDate && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold ring-1', due.overdue ? 'bg-red-50 text-red-600 ring-red-200' : due.days <= 30 ? 'bg-accent-50 text-accent-700 ring-accent-200' : 'bg-slate-50 text-slate-500 ring-slate-200')}>
              {due.overdue ? `${Math.abs(due.days)}d overdue` : `in ${due.days}d`}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card icon={GraduationCap} title="Student & school" subtitle="STEM OPT student details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>School name</label><input value={form.schoolName || ''} onChange={(e) => set('schoolName', e.target.value)} className={input} /></div>
              <div><label className={label}>Degree level</label><input value={form.degreeLevel || ''} onChange={(e) => set('degreeLevel', e.target.value)} placeholder="e.g. Master's" className={input} /></div>
              <div><label className={label}>SEVIS ID</label><input value={form.sevisId || ''} onChange={(e) => set('sevisId', e.target.value)} className={input} /></div>
              <div><label className={label}>Field of study</label><input value={form.fieldOfStudy || ''} onChange={(e) => set('fieldOfStudy', e.target.value)} className={input} /></div>
            </div>
          </Card>

          <Card icon={Building2} title="Employer" subtitle="Employer & training site">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Employer name</label><input value={form.employerName || ''} onChange={(e) => set('employerName', e.target.value)} className={input} /></div>
              <div><label className={label}>Employer EIN</label><input value={form.employerEIN || ''} onChange={(e) => set('employerEIN', e.target.value)} className={input} /></div>
              <div className="sm:col-span-2"><label className={label}>Training site address</label><input value={form.siteAddress || ''} onChange={(e) => set('siteAddress', e.target.value)} className={input} /></div>
            </div>
          </Card>

          <Card icon={UserCheck} title="Training plan" subtitle="Goals, oversight, and supervision">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Job title</label><input value={form.jobTitle || ''} onChange={(e) => set('jobTitle', e.target.value)} className={input} /></div>
              <div><label className={label}>Hours / week</label><input type="number" min={0} value={form.hoursPerWeek ?? ''} onChange={(e) => set('hoursPerWeek', e.target.value ? Number(e.target.value) : undefined)} className={input} /></div>
              <div><label className={label}>Supervisor name</label><input value={form.supervisorName || ''} onChange={(e) => set('supervisorName', e.target.value)} className={input} /></div>
              <div><label className={label}>Supervisor email</label><input type="email" value={form.supervisorEmail || ''} onChange={(e) => set('supervisorEmail', e.target.value)} className={input} /></div>
              <div><label className={label}>Compensation</label><input value={form.compensation || ''} onChange={(e) => set('compensation', e.target.value)} placeholder="e.g. $95,000 / yr" className={input} /></div>
              <div className="sm:col-span-2"><label className={label}>Duties</label><textarea rows={2} value={form.jobDuties || ''} onChange={(e) => set('jobDuties', e.target.value)} className={input} /></div>
              <div className="sm:col-span-2"><label className={label}>Goals & objectives</label><textarea rows={2} value={form.goalsObjectives || ''} onChange={(e) => set('goalsObjectives', e.target.value)} className={input} /></div>
              <div className="sm:col-span-2"><label className={label}>Oversight & measurement</label><textarea rows={2} value={form.oversightMeasurement || ''} onChange={(e) => set('oversightMeasurement', e.target.value)} placeholder="How learning goals are measured & supervised" className={input} /></div>
              <div><label className={label}>Training start</label><input type="date" value={form.trainingStartDate || ''} onChange={(e) => set('trainingStartDate', e.target.value)} className={input} /></div>
              <div><label className={label}>Training end</label><input type="date" value={form.trainingEndDate || ''} onChange={(e) => set('trainingEndDate', e.target.value)} className={input} /></div>
            </div>
          </Card>

          <Card icon={CalendarClock} title="Evaluations" subtitle="STEM OPT requires a 12-month self-evaluation and a 24-month final evaluation">
            <div className="grid gap-4 sm:grid-cols-2">
              <EvalBlock title="12-month evaluation" value={eval12} onChange={setEval12} />
              <EvalBlock title="24-month (final) evaluation" value={eval24} onChange={setEval24} />
            </div>
          </Card>

          <Card icon={GitCompareArrows} title="Material changes" subtitle="Log changes to the training plan, hours, supervisor, or worksite">
            {changes.length > 0 && (
              <div className="space-y-2.5">
                {changes.map((c) => (
                  <div key={c.id} className="grid items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:grid-cols-12">
                    <input type="date" value={c.date || ''} onChange={(e) => updateChange(c.id, 'date', e.target.value)} className={cn(input, 'sm:col-span-3')} />
                    <input value={c.description} onChange={(e) => updateChange(c.id, 'description', e.target.value)} placeholder="What changed" className={cn(input, 'sm:col-span-6')} />
                    <input type="date" value={c.reportedDate || ''} onChange={(e) => updateChange(c.id, 'reportedDate', e.target.value)} title="Reported to school" className={cn(input, 'sm:col-span-2')} />
                    <button type="button" onClick={() => removeChange(c.id)} className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:col-span-1" aria-label="Remove"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addChange} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50/40"><Plus className="h-4 w-4" strokeWidth={1.75} /> Log a material change</button>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400"><Info className="mt-0.5 h-3 w-3 flex-shrink-0" strokeWidth={2} /> Material changes must be reported to your DSO and reflected in an updated I-983.</p>
          </Card>

          <Card icon={FolderArchive} title="I-983 documents" subtitle="Signed training plan, evaluations, amendments">
            <DocumentUploader value={docs} onChange={setDocs} folder={`i983/${employeeId}`} label="" />
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {rec && (
                <button onClick={() => setDelConfirm(true)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"><Trash2 className="h-4 w-4" strokeWidth={1.75} /> Delete plan</button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => router.push('/i983')} className="btn-ghost">Cancel</button>
              <button onClick={save} disabled={saving || !hydrated} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Save className="h-4 w-4" strokeWidth={1.75} />} Save I-983
              </button>
            </div>
          </div>

          <ConfirmDialog
            isOpen={delConfirm}
            onClose={() => setDelConfirm(false)}
            onConfirm={handleDelete}
            title="Delete I-983 plan"
            description={<>Delete the I-983 training plan for <span className="font-semibold text-slate-900">{emp?.name || 'this employee'}</span>? This cannot be undone.</>}
            confirmLabel="Delete plan"
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
                <p className="text-xs text-slate-500">Plan & evaluation history</p>
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
