'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { useHandbook } from '@/context/HandbookContext';
import { HandbookForm, HandbookFormData, HANDBOOK_FORM_CATEGORIES } from '@/types/handbook';
import { UploadedDoc } from '@/types/uploads';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea, NativeSelect } from '@/components/ui/input';

export default function HandbookFormModal({ isOpen, onClose, mode, form: formDoc }: {
  isOpen: boolean; onClose: () => void; mode: 'create' | 'edit'; form?: HandbookForm;
}) {
  const { createForm, updateForm } = useHandbook();
  const toast = useToast();
  const [form, setForm] = useState<HandbookFormData>({ title: '', category: '', description: '', documents: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(mode === 'edit' && formDoc
      ? { title: formDoc.title, category: formDoc.category || '', description: formDoc.description || '', documents: formDoc.documents || [] }
      : { title: '', category: '', description: '', documents: [] }
    );
    setErrors({});
  }, [mode, formDoc, isOpen]);

  const set = (k: keyof HandbookFormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const e = { ...p }; delete e[k]; return e; });
  };

  const setDocs = (docs: UploadedDoc[]) => setForm((p) => ({ ...p, documents: docs }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { setErrors({ title: 'Title is required' }); return; }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createForm(form);
        toast.success('Form added', `${form.title} has been added to the handbook.`);
      } else {
        await updateForm(formDoc!.id, form);
        toast.success('Form updated', `${form.title} has been saved.`);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setErrors({ _: message });
      toast.error(mode === 'create' ? 'Could not add form' : 'Could not update form', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <FileText className="h-4.5 w-4.5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">
              {mode === 'create' ? 'Add form' : 'Edit form'}
            </h2>
            <p className="text-xs text-slate-400">{mode === 'create' ? 'Add a company form or document' : 'Update form details'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {errors._ && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errors._}</p>}

          <FormField label="Title" required error={errors.title}>
            <Input type="text" invalid={!!errors.title} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Employment Application Form" />
          </FormField>

          <FormField label="Category">
            <NativeSelect value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select a category</option>
              {HANDBOOK_FORM_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Short summary of what this form is used for" className="resize-none" />
          </FormField>

          <DocumentUploader value={form.documents} onChange={setDocs} folder="handbook-forms" label="Attached documents" />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Add form' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
