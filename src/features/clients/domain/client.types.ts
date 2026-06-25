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
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

export interface ClientWithCount extends Client {
  employeeCount: number;
}
