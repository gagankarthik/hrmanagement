'use client';

import * as React from 'react';
import {
  Upload, FileSpreadsheet, ClipboardPaste, Download, X,
  CheckCircle2, AlertCircle, ArrowLeft, Loader2, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportEntityConfig, LookupTables, ValidatedRow } from '@/lib/bulk-import/types';
import { CellMatrix, mapToRecords, parsePastedText, parseSpreadsheetFile } from '@/lib/bulk-import/parse';
import { summarize, validateRows } from '@/lib/bulk-import/validate';
import { downloadTemplate } from '@/lib/bulk-import/template';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  /** One config for partners; the four employee types for the workforce. */
  configs: ImportEntityConfig[];
  title: string;
  /** Existing records for name → id resolution (employees). */
  lookups?: LookupTables;
  /** Called with the created count after a successful import (refresh + toast). */
  onImported: (created: number) => void;
}

type Step = 'input' | 'preview' | 'result';
type Mode = 'upload' | 'paste';

function cell(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  return String(v).trim();
}

export function BulkImportModal({ open, onClose, configs, title, lookups = {}, onImported }: BulkImportModalProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [mode, setMode] = React.useState<Mode>('upload');
  const [paste, setPaste] = React.useState('');
  const [matrix, setMatrix] = React.useState<CellMatrix | null>(null);
  const [fileName, setFileName] = React.useState('');
  const [step, setStep] = React.useState<Step>('input');
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ created: number; failed: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const config = configs[Math.min(activeIndex, configs.length - 1)];

  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setMode('upload');
    setPaste('');
    setMatrix(null);
    setFileName('');
    setStep('input');
    setImporting(false);
    setResult(null);
    setError(null);
    setDragging(false);
  }, [open]);

  // Everything below is re-derived whenever the source grid or the active
  // config (employee type) changes — so switching type re-maps live.
  const parsed = React.useMemo(
    () => (matrix ? mapToRecords(matrix, config) : null),
    [matrix, config],
  );
  const validated: ValidatedRow[] = React.useMemo(
    () => (parsed ? validateRows(parsed.records, config, lookups) : []),
    [parsed, config, lookups],
  );
  const summary = React.useMemo(() => summarize(validated), [validated]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !importing) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, importing, onClose]);

  if (!open) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const m = await parseSpreadsheetFile(file);
      if (!m.length) { setError('That file looks empty.'); return; }
      setFileName(file.name);
      setMatrix(m);
      setStep('preview');
    } catch {
      setError('Could not read that file. Use .xlsx or .csv.');
    }
  };

  const handlePastePreview = () => {
    setError(null);
    const m = parsePastedText(paste);
    if (m.length < 2) { setError('Paste the header row plus at least one data row.'); return; }
    setFileName('Pasted data');
    setMatrix(m);
    setStep('preview');
  };

  const handleImport = async () => {
    const rows = validated.filter((v) => !v.skip && v.errors.length === 0).map((v) => v.values);
    if (!rows.length) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(config.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Import failed');
      }
      setResult({ created: data.created ?? 0, failed: data.failed ?? 0 });
      setStep('result');
      if (data.created > 0) onImported(data.created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const matchedColumns = parsed
    ? config.columns.filter((c) => parsed.matchedFields.includes(c.field))
    : [];
  const displayRows = validated
    .map((v, i) => ({ v, raw: parsed?.records[i] ?? {} }))
    .filter(({ v }) => !v.skip);
  const shown = displayRows.slice(0, 250);
  const importableCount = summary.valid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !importing && onClose()}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {step === 'input' && 'Upload a spreadsheet or paste rows from Excel'}
                {step === 'preview' && `Reviewing ${fileName}`}
                {step === 'result' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={() => !importing && onClose()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Employee type selector */}
          {configs.length > 1 && step !== 'result' && (
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Employee type</p>
              <div className="flex flex-wrap gap-1.5">
                {configs.map((c, i) => (
                  <button
                    key={c.key}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      i === activeIndex ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── INPUT STEP ── */}
          {step === 'input' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMode('upload')}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      mode === 'upload' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    <Upload className="h-4 w-4" /> Upload file
                  </button>
                  <button
                    onClick={() => setMode('paste')}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      mode === 'paste' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    <ClipboardPaste className="h-4 w-4" /> Paste rows
                  </button>
                </div>
                <button
                  onClick={() => downloadTemplate(config)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Template
                </button>
              </div>

              {mode === 'upload' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                    dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-slate-100/60',
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">Drop your file here, or click to browse</p>
                  <p className="mt-1 text-xs text-slate-400">Excel (.xlsx) or CSV · first row must be the column headers</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                    rows={8}
                    placeholder={`Paste cells copied from Excel/Sheets — include the header row.\n\n${config.columns.map((c) => c.header).join('\t')}`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePastePreview}
                      disabled={!paste.trim()}
                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Preview rows
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-slate-100">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span>
                  Headers are matched to fields automatically (case-insensitive). Required:{' '}
                  <span className="font-semibold text-slate-600">
                    {config.columns.filter((c) => c.required).map((c) => c.header).join(', ') || 'none'}
                  </span>
                  . Download the template for the exact columns and allowed values.
                </span>
              </div>
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === 'preview' && parsed && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Chip tone="emerald" label={`${summary.valid} ready`} />
                {summary.invalid > 0 && <Chip tone="red" label={`${summary.invalid} with issues`} />}
                {summary.skipped > 0 && <Chip tone="slate" label={`${summary.skipped} blank skipped`} />}
              </div>

              {parsed.missingRequired.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Missing required column{parsed.missingRequired.length > 1 ? 's' : ''}: <span className="font-semibold">{parsed.missingRequired.join(', ')}</span></span>
                </div>
              )}
              {matchedColumns.length === 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>No columns matched. Download the template and keep its header row.</span>
                </div>
              )}
              {parsed.unknownHeaders.length > 0 && (
                <p className="text-xs text-slate-400">Ignored columns: {parsed.unknownHeaders.join(', ')}</p>
              )}

              {shown.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        {matchedColumns.map((c) => (
                          <th key={c.field} className="whitespace-nowrap px-3 py-2 text-left">{c.header}</th>
                        ))}
                        <th className="px-3 py-2 text-left">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map(({ v, raw }) => {
                        const bad = v.errors.length > 0;
                        return (
                          <tr key={v.rowNumber} className={cn('border-b border-slate-50 last:border-0', bad && 'bg-red-50/50')}>
                            <td className="px-3 py-2 text-xs text-slate-400">{v.rowNumber}</td>
                            <td className="px-3 py-2">
                              {bad
                                ? <AlertCircle className="h-4 w-4 text-red-500" />
                                : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </td>
                            {matchedColumns.map((c) => (
                              <td key={c.field} className="max-w-[180px] truncate whitespace-nowrap px-3 py-2 text-slate-700">
                                {cell(raw[c.field]) || <span className="text-slate-300">—</span>}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-xs text-red-600">{v.errors.join('; ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {displayRows.length > shown.length && (
                <p className="text-xs text-slate-400">Showing first {shown.length} of {displayRows.length} rows. All valid rows will be imported.</p>
              )}
            </div>
          )}

          {/* ── RESULT STEP ── */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', result.failed > 0 ? 'bg-amber-100' : 'bg-emerald-100')}>
                {result.failed > 0
                  ? <AlertCircle className="h-8 w-8 text-amber-600" />
                  : <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
              </div>
              <h4 className="mt-4 text-xl font-semibold text-slate-900">
                Imported {result.created} {config.label.toLowerCase()} record{result.created !== 1 ? 's' : ''}
              </h4>
              {result.failed > 0 && (
                <p className="mt-1 text-sm text-amber-600">{result.failed} row{result.failed !== 1 ? 's' : ''} could not be saved.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <div>
            {step === 'preview' && (
              <button
                onClick={() => { setStep('input'); setMatrix(null); setError(null); }}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 'result' ? (
              <>
                <button
                  onClick={() => { setStep('input'); setMatrix(null); setResult(null); setPaste(''); setFileName(''); }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Import more
                </button>
                <button onClick={onClose} className="btn-primary">Done</button>
              </>
            ) : step === 'preview' ? (
              <button
                onClick={handleImport}
                disabled={importing || importableCount === 0}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                  : <>Import {importableCount} row{importableCount !== 1 ? 's' : ''}</>}
              </button>
            ) : (
              <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ tone, label }: { tone: 'emerald' | 'red' | 'slate'; label: string }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  }[tone];
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', styles)}>{label}</span>;
}
