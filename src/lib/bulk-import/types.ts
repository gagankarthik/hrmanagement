// Shared types for the bulk-import feature (spreadsheet / paste onboarding).
// Pure types only — safe to import from both client and server code.

export type ImportFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'select'
  | 'boolean'
  | 'lookup';

/** A list a `lookup` column resolves a typed name against. */
export type LookupKey = 'clients' | 'vendors' | 'subcontractors' | 'endclients';

/** One importable column. Maps a spreadsheet header to a payload field. */
export interface ImportColumn {
  /** Key written to the API payload. */
  field: string;
  /** Human header used in the template and matched (case-insensitively) on upload. */
  header: string;
  type: ImportFieldType;
  required?: boolean;
  /** Accepted values for a `select` (we also accept their labels). */
  options?: string[];
  /** value -> friendly label, used for template hints and label matching. */
  optionLabels?: Record<string, string>;
  /** For `lookup` columns: which entity list a typed name is resolved against. */
  lookup?: LookupKey;
  /** Example cell value written into the downloadable template. */
  example?: string;
  /** Extra header spellings accepted on upload (besides `header` and `field`). */
  aliases?: string[];
}

export interface ImportEntityConfig {
  /** Stable id, e.g. 'clients' or 'employee-w2'. */
  key: string;
  /** Display label, e.g. 'Clients' or 'W2'. */
  label: string;
  /** Bulk endpoint this config posts to. */
  apiPath: string;
  /** Values forced onto every row before submit (e.g. { type: 'W2' }). */
  fixed?: Record<string, unknown>;
  columns: ImportColumn[];
}

/** Minimal shape of an entity used for name -> id resolution. */
export interface LookupRecord {
  id: string;
  name: string;
}

export type LookupTables = Partial<Record<LookupKey, LookupRecord[]>>;

/** Result of validating one parsed data row. */
export interface ValidatedRow {
  /** 1-based position among data rows (excludes the header). */
  rowNumber: number;
  /** Normalized payload ready to submit (ids resolved, dates ISO, etc.). */
  values: Record<string, unknown>;
  /** Per-field problems; empty means the row is importable. */
  errors: string[];
  /** Blank rows are skipped rather than flagged as errors. */
  skip: boolean;
}

/** Per-row outcome returned by a bulk API route. */
export interface BulkRowResult {
  rowNumber: number;
  ok: boolean;
  error?: string;
}

export interface BulkApiResponse {
  success: boolean;
  created: number;
  failed: number;
  results?: BulkRowResult[];
  error?: string;
}
