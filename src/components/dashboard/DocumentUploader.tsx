'use client';

import React, { useRef, useState } from 'react';
import { FileText, X, Loader2, ExternalLink, UploadCloud } from 'lucide-react';
import { UploadedDoc } from '@/types/uploads';

function fmtSize(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

interface Props {
  value?: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
  folder: string;
  label?: string;
  disabled?: boolean;
}

export function DocumentUploader({ value = [], onChange, folder, label = 'Documents', disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    setUploading(true);
    try {
      const added: UploadedDoc[] = [];
      for (const file of Array.from(files)) {
        const res = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, folder }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Upload is not available');
        const put = await fetch(data.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
        if (!put.ok) throw new Error(`Failed to upload ${file.name}`);
        added.push({ name: file.name, key: data.key, contentType: file.type, size: file.size, uploadedAt: new Date().toISOString() });
      }
      onChange([...(value || []), ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>}

      {(value || []).length > 0 && (
        <div className="space-y-2">
          {(value || []).map((doc) => (
            <div key={doc.key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{doc.name}</span>
              {doc.size ? <span className="shrink-0 text-[11px] text-slate-400">{fmtSize(doc.size)}</span> : null}
              <a
                href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-brand-600"
                title="View"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange((value || []).filter((d) => d.key !== doc.key))}
                  className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-red-500"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
      )}
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
