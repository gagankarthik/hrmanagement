/**
 * Subcontractor domain types. Framework-free — no React, no fetch, no AWS.
 * This is the canonical home; `src/types/subcontractor.ts` re-exports it for
 * backward compatibility during the migration.
 */

// Subcontractor entity interface
export interface Subcontractor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  /** Optional phone extension, e.g. "204". Stored separately from `phone`. */
  phoneExtension?: string;
  /** Street line. Records created before the address split hold the whole address here. */
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: 'Active' | 'Inactive';
  /** Certificate of Insurance — policy effective date (ISO yyyy-mm-dd) */
  coiEffectiveDate?: string;
  /** Certificate of Insurance — policy expiry date (ISO yyyy-mm-dd) */
  coiExpiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Subcontractor form data (for creation/editing)
export interface SubcontractorFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  phoneExtension?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: 'Active' | 'Inactive';
  coiEffectiveDate?: string;
  coiExpiryDate?: string;
}

// Subcontractor with employee count (for dashboard display)
export interface SubcontractorWithCount extends Subcontractor {
  employeeCount: number;
}
