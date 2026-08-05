/**
 * End Client domain types. Framework-free; `src/types/endclient.ts` re-exports these.
 */
export interface EndClient {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  /** Optional phone extension, e.g. "204". Stored separately from `phone`. */
  phoneExtension?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface EndClientFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  phoneExtension?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

export interface EndClientWithCount extends EndClient {
  employeeCount: number;
}
