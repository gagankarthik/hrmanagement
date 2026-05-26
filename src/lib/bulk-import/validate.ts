// Row validation + normalization. Pure (no DOM, no AWS) so it can run in the
// browser for the live preview and again on the server as a safety net.

import { ImportColumn, ImportEntityConfig, LookupTables, ValidatedRow } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRUTHY = new Set(['true', 'yes', 'y', '1', 'x', '✓', 'checked', 't']);
const FALSY = new Set(['false', 'no', 'n', '0', '']);

function toStr(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  return String(v).trim();
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(s: string): boolean | null {
  const v = s.toLowerCase();
  if (TRUTHY.has(v)) return true;
  if (FALSY.has(v)) return false;
  return null;
}

/** Accepts a Date, ISO (YYYY-MM-DD), US (M/D/YYYY) or anything Date.parse handles. Returns ISO date. */
function normalizeDate(raw: unknown): string | null {
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10);
  const s = toStr(raw);
  if (!s) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const us = /^(\d{1,2})[/](\d{1,2})[/](\d{2,4})$/.exec(s);
  if (us) {
    const yr = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${yr}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  }

  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/** Match a select cell against option values or their friendly labels (case-insensitive). */
function matchOption(s: string, col: ImportColumn): string | null {
  const v = s.toLowerCase();
  for (const opt of col.options ?? []) {
    if (opt.toLowerCase() === v) return opt;
    const label = col.optionLabels?.[opt];
    if (label && label.toLowerCase() === v) return opt;
  }
  return null;
}

function resolveLookup(name: string, list: { id: string; name: string }[] | undefined): string | null {
  if (!list || !list.length) return null;
  const v = name.toLowerCase();
  const hit = list.find((r) => (r.name ?? '').toLowerCase().trim() === v);
  return hit ? hit.id : null;
}

export function validateRows(
  records: Record<string, unknown>[],
  config: ImportEntityConfig,
  lookups: LookupTables = {},
): ValidatedRow[] {
  return records.map((rec, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];
    const values: Record<string, unknown> = { ...config.fixed };

    const allBlank = config.columns.every((c) => toStr(rec[c.field]) === '');
    if (allBlank) return { rowNumber, values, errors, skip: true };

    for (const col of config.columns) {
      const raw = rec[col.field];
      const s = toStr(raw);

      if (s === '') {
        if (col.required) errors.push(`${col.header} is required`);
        else if (col.type === 'boolean') values[col.field] = false;
        continue;
      }

      switch (col.type) {
        case 'email':
          if (!EMAIL_RE.test(s)) errors.push(`${col.header} "${s}" is not a valid email`);
          else values[col.field] = s;
          break;
        case 'number': {
          const n = parseNumber(s);
          if (n === null) errors.push(`${col.header} "${s}" is not a number`);
          else values[col.field] = n;
          break;
        }
        case 'date': {
          const d = normalizeDate(raw);
          if (!d) errors.push(`${col.header} "${s}" is not a valid date (use YYYY-MM-DD)`);
          else values[col.field] = d;
          break;
        }
        case 'boolean': {
          const b = parseBoolean(s);
          if (b === null) errors.push(`${col.header} "${s}" must be Yes or No`);
          else values[col.field] = b;
          break;
        }
        case 'select': {
          const opt = matchOption(s, col);
          if (!opt) errors.push(`${col.header} "${s}" must be one of: ${(col.options ?? []).join(', ')}`);
          else values[col.field] = opt;
          break;
        }
        case 'lookup': {
          const id = resolveLookup(s, lookups[col.lookup!]);
          if (!id) errors.push(`${col.header} "${s}" was not found — add it first or fix the name`);
          else values[col.field] = id;
          break;
        }
        default:
          values[col.field] = s;
      }
    }

    return { rowNumber, values, errors, skip: false };
  });
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  skipped: number;
}

export function summarize(rows: ValidatedRow[]): ValidationSummary {
  let valid = 0;
  let invalid = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.skip) skipped++;
    else if (r.errors.length) invalid++;
    else valid++;
  }
  return { total: rows.length, valid, invalid, skipped };
}
