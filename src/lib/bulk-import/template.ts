// Generates a downloadable .xlsx template for a given import config: a Template
// sheet (headers + one example row) and a Guide sheet documenting each column.
// Browser-only (uses SheetJS writeFile).

import * as XLSX from 'xlsx';
import { ImportColumn, ImportEntityConfig } from './types';

function typeLabel(col: ImportColumn): string {
  switch (col.type) {
    case 'email': return 'Email';
    case 'tel': return 'Phone';
    case 'date': return 'Date (YYYY-MM-DD)';
    case 'number': return 'Number';
    case 'boolean': return 'Yes / No';
    case 'select': return 'Choice';
    case 'lookup': return `Existing ${col.lookup} name`;
    default: return 'Text';
  }
}

function notes(col: ImportColumn): string {
  if (col.type === 'select') return `Allowed: ${(col.options ?? []).join(', ')}`;
  if (col.type === 'lookup') return `Must exactly match an existing ${col.lookup} name on record`;
  if (col.type === 'boolean') return 'Enter Yes or No';
  if (col.type === 'date') return 'e.g. 2026-01-15';
  return '';
}

export function downloadTemplate(config: ImportEntityConfig): void {
  const headers = config.columns.map((c) => c.header);
  const example = config.columns.map((c) => c.example ?? '');

  const wb = XLSX.utils.book_new();

  const main = XLSX.utils.aoa_to_sheet([headers, example]);
  main['!cols'] = config.columns.map((c) => ({ wch: Math.max(14, c.header.length + 2) }));
  XLSX.utils.book_append_sheet(wb, main, 'Template');

  const guide: (string)[][] = [['Column', 'Required', 'Type', 'Notes']];
  for (const c of config.columns) {
    guide.push([c.header, c.required ? 'Yes' : 'No', typeLabel(c), notes(c)]);
  }
  const guideSheet = XLSX.utils.aoa_to_sheet(guide);
  guideSheet['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Guide');

  XLSX.writeFile(wb, `${config.key}-import-template.xlsx`);
}
