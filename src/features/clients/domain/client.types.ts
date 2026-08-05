/**
 * Client domain types. Framework-free (no React / fetch / AWS). Canonical home;
 * `src/types/client.ts` re-exports these for backward compatibility.
 */
export interface Client {
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
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
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
}

export interface ClientWithCount extends Client {
  employeeCount: number;
}
