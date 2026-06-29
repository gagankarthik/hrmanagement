'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, FileText, ExternalLink, Download, Tag, Search } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import HandbookFormModal from '@/components/dashboard/HandbookFormModal';
import { useHandbook } from '@/context/HandbookContext';
import { useAccess } from '@/hooks/useAccess';
import { HandbookForm, HANDBOOK_FORM_CATEGORIES } from '@/types/handbook';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

export default function HandbookPage() {
  const { forms, isLoading, deleteForm } = useHandbook();
  const { canManage } = useAccess();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; form?: HandbookForm }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ form: HandbookForm | null; isDeleting: boolean }>({
    form: null, isDeleting: false,
  });

  const openCreate = () => setModalState({ isOpen: true, mode: 'create' });
  const openEdit = (form: HandbookForm) => setModalState({ isOpen: true, mode: 'edit', form });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return forms.filter((f) => {
      if (category && f.category !== category) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        (f.category || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    });
  }, [forms, search, category]);

  const confirmDelete = async () => {
    const form = deleteState.form;
    if (!form) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteForm(form.id);
      toast.success('Form deleted', `${form.title} has been removed.`);
      setDeleteState({ form: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete form', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="Company"
        title="Handbook"
        description="Company forms and documents for hiring, onboarding, termination, leave requests and more"
        tone="brand"
        actions={
          canManage ? (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add form
            </button>
          ) : undefined
        }
      />

      {!isLoading && forms.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forms…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50 sm:w-48"
          >
            <option value="">All categories</option>
            {HANDBOOK_FORM_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : forms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          tone="brand"
          title="No forms yet"
          description="Add your first company form — hiring, onboarding, termination, leave requests and more."
          action={
            canManage ? (
              <button onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add form
              </button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          tone="brand"
          title="No matching forms"
          description="Try a different search term or category filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form, i) => (
            <div
              key={form.id}
              className="surface surface-hover flex flex-col p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                    <FileText className="h-4.5 w-4.5 text-brand-600" />
                  </div>
                  <h3 className="min-w-0 truncate font-display text-base font-bold text-slate-900">{form.title}</h3>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => openEdit(form)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteState({ form, isDeleting: false })}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {form.category && (
                <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <Tag className="h-3 w-3" />{form.category}
                </span>
              )}

              {form.description && <p className="mt-3 text-sm text-slate-600">{form.description}</p>}

              {form.documents && form.documents.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {form.documents.length} {form.documents.length === 1 ? 'document' : 'documents'}
                  </p>
                  {form.documents.map((doc) => (
                    <div
                      key={doc.key}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
                      <a
                        href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-brand-600"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}&download=1&name=${encodeURIComponent(doc.name)}`}
                        className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-brand-600"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">No documents attached</p>
              )}
            </div>
          ))}
        </div>
      )}

      <HandbookFormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        form={modalState.form}
      />

      <ConfirmDialog
        isOpen={deleteState.form !== null}
        onClose={() => setDeleteState({ form: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete form"
        description={
          deleteState.form ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.form.title}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete form"
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}
