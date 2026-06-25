'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderArchive, Save, Loader2, Trash2, FileText, ExternalLink, Download, X, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEmployees } from '@/context/EmployeeContext';
import { useEmployeeDocs } from '@/context/EmployeeDocsContext';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { DOC_CATEGORIES, DocCategory, EmployeeDocItem } from '@/types/employee-docs';
import type { UploadedDoc } from '@/types/uploads';
import type { Employee } from '@/types/employee';

const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

function fmtSize(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

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

export default function EmployeeDocsManagePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const router = useRouter();
  const { getEmployeeById } = useEmployees();
  const { getByEmployee, saveRecord, deleteRecord, isLoading } = useEmployeeDocs();
  const toast = useToast();

  const emp = getEmployeeById(employeeId) as Employee | undefined;
  const rec = getByEmployee(employeeId);

  const [docs, setDocs] = useState<EmployeeDocItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (rec) {
      setDocs(rec.documents || []);
      setHydrated(true);
    } else if (!isLoading) {
      setDocs([]);
      setHydrated(true);
    }
  }, [rec, isLoading, hydrated]);

  // Merge uploads from DocumentUploader (UploadedDoc[]) into EmployeeDocItem[],
  // preserving existing categories/notes (match by key), defaulting new ones to 'Other'.
  const handleUploaderChange = (uploaded: UploadedDoc[]) => {
    setDocs((prev) => {
      const byKey = new Map(prev.map((d) => [d.key, d]));
      return uploaded.map((u) => {
        const existing = byKey.get(u.key);
        return existing
          ? { ...existing, ...u }
          : { ...u, category: 'Other' as DocCategory };
      });
    });
  };

  const setCategory = (key: string, category: DocCategory) =>
    setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, category } : d)));

  const setNote = (key: string, note: string) =>
    setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, note } : d)));

  const removeDoc = (key: string) => setDocs((prev) => prev.filter((d) => d.key !== key));

  // Group documents by category for display.
  const grouped = useMemo(() => {
    const map = new Map<DocCategory, EmployeeDocItem[]>();
    for (const d of docs) {
      const cat = (d.category || 'Other') as DocCategory;
      const arr = map.get(cat) || [];
      arr.push(d);
      map.set(cat, arr);
    }
    return DOC_CATEGORIES.map((c) => ({ category: c, items: map.get(c) || [] })).filter((g) => g.items.length > 0);
  }, [docs]);

  const save = async () => {
    setSaving(true);
    try {
      await saveRecord({
        employeeId,
        employeeName: emp?.name || '',
        documents: docs,
      });
      toast.success('Documents saved', `${emp?.name || 'Employee'} · ${docs.length} ${docs.length === 1 ? 'document' : 'documents'}`);
    } catch (err) {
      toast.error('Could not save documents', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecord(employeeId);
      toast.success('Documents removed', `Cleared all documents for ${emp?.name || 'employee'}`);
      setConfirmDelete(false);
      router.push('/documents');
    } catch (err) {
      toast.error('Could not delete', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!emp && !isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button onClick={() => router.push('/documents')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to Employee Documents</button>
        <div className="surface p-10 text-center text-sm text-slate-500">Employee not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/documents')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to Employee Documents
      </button>

      <PageHeader
        icon={FolderArchive}
        eyebrow="Employee Documents"
        title={emp?.name || 'Employee'}
        description={`${emp?.type || ''} · ${docs.length} ${docs.length === 1 ? 'document' : 'documents'} on file`}
        tone="brand"
        actions={
          <button onClick={() => setConfirmDelete(true)} disabled={!rec} className="btn-ghost text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Trash2 className="h-4 w-4" strokeWidth={1.75} /> Delete all
          </button>
        }
      />

      <Card icon={UploadCloud} title="Upload documents" subtitle="Drop in any employee file — new uploads default to the “Other” category">
        <DocumentUploader value={docs} onChange={handleUploaderChange} folder={`employee-docs/${employeeId}`} label="" />
      </Card>

      <Card icon={FolderArchive} title="Document library" subtitle="Categorize, annotate, view & download each document">
        {docs.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No documents yet. Upload files above to get started.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-2.5 flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700">{category}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((doc) => (
                    <div key={doc.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.75} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
                          {doc.size ? <p className="text-[11px] text-slate-400">{fmtSize(doc.size)}</p> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <a
                            href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1.5 text-slate-400 transition-colors hover:text-brand-600"
                            title="View in new tab"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                          </a>
                          <a
                            href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}&download=1&name=${encodeURIComponent(doc.name)}`}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:text-brand-600"
                            title="Download"
                          >
                            <Download className="h-4 w-4" strokeWidth={1.75} />
                          </a>
                          <button
                            type="button"
                            onClick={() => removeDoc(doc.key)}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:text-red-500"
                            title="Remove"
                          >
                            <X className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className={label}>Category</label>
                          <select value={doc.category || 'Other'} onChange={(e) => setCategory(doc.key, e.target.value as DocCategory)} className={input}>
                            {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={label}>Note</label>
                          <input value={doc.note || ''} onChange={(e) => setNote(doc.key, e.target.value)} placeholder="Optional note" className={input} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <button onClick={() => router.push('/documents')} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={saving || !hydrated} className={cn('btn-primary disabled:cursor-not-allowed disabled:opacity-50')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Save className="h-4 w-4" strokeWidth={1.75} />} Save documents
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        title="Delete all documents?"
        description={`This permanently removes the document record for ${emp?.name || 'this employee'}. The files in storage are not deleted.`}
        confirmLabel="Delete all"
        tone="danger"
        isLoading={deleting}
      />
    </div>
  );
}
