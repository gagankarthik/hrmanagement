'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, FileText, ExternalLink, Tag } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import SopModal from '@/components/dashboard/SopModal';
import { useHandbook } from '@/context/HandbookContext';
import { SopDoc } from '@/types/handbook';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

export default function CompanyProceduresPage() {
  const { sops, isLoading, deleteSop } = useHandbook();
  const toast = useToast();

  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; sop?: SopDoc }>({
    isOpen: false, mode: 'create',
  });
  const [deleteState, setDeleteState] = useState<{ sop: SopDoc | null; isDeleting: boolean }>({
    sop: null, isDeleting: false,
  });

  const openCreateSop = () => setModalState({ isOpen: true, mode: 'create' });
  const openEditSop = (sop: SopDoc) => setModalState({ isOpen: true, mode: 'edit', sop });

  const confirmDelete = async () => {
    const sop = deleteState.sop;
    if (!sop) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteSop(sop.id);
      toast.success('Document deleted', `${sop.title} has been removed.`);
      setDeleteState({ sop: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete document', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="Company"
        title="Company Procedures"
        description="Standard operating procedures and shared company documents"
        tone="brand"
        actions={
          <button onClick={openCreateSop} className="btn-primary">
            <Plus className="h-4 w-4" /> Add document
          </button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : sops.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          tone="brand"
          title="No documents yet"
          description="Add your first SOP or company procedure document to share it with the team."
          action={
            <button onClick={openCreateSop} className="btn-primary">
              <Plus className="h-4 w-4" /> Add document
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop, i) => (
            <div
              key={sop.id}
              className="surface surface-hover flex flex-col p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                    <BookOpen className="h-4.5 w-4.5 text-brand-600" />
                  </div>
                  <h3 className="min-w-0 truncate font-display text-base font-bold text-slate-900">{sop.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => openEditSop(sop)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteState({ sop, isDeleting: false })}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {sop.category && (
                <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <Tag className="h-3 w-3" />{sop.category}
                </span>
              )}

              {sop.description && <p className="mt-3 text-sm text-slate-600">{sop.description}</p>}

              {sop.documents && sop.documents.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  {sop.documents.map((doc) => (
                    <a
                      key={doc.key}
                      href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SopModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        sop={modalState.sop}
      />

      <ConfirmDialog
        isOpen={deleteState.sop !== null}
        onClose={() => setDeleteState({ sop: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete document"
        description={
          deleteState.sop ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.sop.title}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete document"
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}
