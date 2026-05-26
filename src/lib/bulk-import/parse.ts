// Parsing layer for bulk import. Turns an uploaded .xlsx/.csv file OR pasted
// spreadsheet text into a matrix of cells, then maps the header row onto the
// fields of an ImportEntityConfig. Runs in the browser (SheetJS works there).

import * as XLSX from 'xlsx';
import { ImportEntityConfig } from './types';

/** A raw grid: row 0 is the header row, the rest are data rows. */
export type CellMatrix = unknown[][];

export interface ParsedTable {
  /** Trimmed header labels as they appeared in the source. */
  headers: string[];
  /** One record per data row, keyed by the config field a header matched. */
  records: Record<string, unknown>[];
  /** Config fields that were matched to a header column. */
  matchedFields: string[];
  /** Required fields whose column was missing entirely. */
  missingRequired: string[];
  /** Non-empty headers that matched no known column (ignored on import). */
  unknownHeaders: string[];
}

// ── File parsing (SheetJS) ───────────────────────────────────────────────────
export async function parseSpreadsheetFile(file: File): Promise<CellMatrix> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: '',
  });
}

// ── Pasted text parsing ──────────────────────────────────────────────────────
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  return firstLine.includes('\t') ? '\t' : ',';
}

/** Quote-aware splitter that handles TSV (Excel copy) and CSV, incl. multiline cells. */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);

  // Drop trailing rows that are entirely empty.
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === '')) rows.pop();
  return rows;
}

export function parsePastedText(text: string): CellMatrix {
  const trimmed = text.replace(/^﻿/, '').trimEnd();
  if (!trimmed) return [];
  return parseDelimited(trimmed, detectDelimiter(trimmed));
}

// ── Header → field mapping ───────────────────────────────────────────────────
function normalizeHeader(s: unknown): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function mapToRecords(matrix: CellMatrix, config: ImportEntityConfig): ParsedTable {
  if (!matrix.length) {
    return { headers: [], records: [], matchedFields: [], missingRequired: [], unknownHeaders: [] };
  }

  const headerRow = (matrix[0] as unknown[]).map((h) => String(h ?? '').trim());

  // Build lookup from any accepted spelling -> config field.
  const fieldByNorm = new Map<string, string>();
  for (const col of config.columns) {
    fieldByNorm.set(normalizeHeader(col.header), col.field);
    fieldByNorm.set(normalizeHeader(col.field), col.field);
    for (const a of col.aliases ?? []) fieldByNorm.set(normalizeHeader(a), col.field);
  }

  const colFieldByIndex: (string | null)[] = [];
  const matchedFields = new Set<string>();
  const unknownHeaders: string[] = [];

  headerRow.forEach((h, i) => {
    if (!h) { colFieldByIndex[i] = null; return; }
    const field = fieldByNorm.get(normalizeHeader(h)) ?? null;
    colFieldByIndex[i] = field;
    if (field) matchedFields.add(field);
    else unknownHeaders.push(h);
  });

  const records: Record<string, unknown>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r] as unknown[];
    const rec: Record<string, unknown> = {};
    colFieldByIndex.forEach((field, i) => {
      if (field) rec[field] = cells[i];
    });
    records.push(rec);
  }

  const missingRequired = config.columns
    .filter((c) => c.required && !matchedFields.has(c.field))
    .map((c) => c.header);

  return {
    headers: headerRow,
    records,
    matchedFields: [...matchedFields],
    missingRequired,
    unknownHeaders,
  };
}
