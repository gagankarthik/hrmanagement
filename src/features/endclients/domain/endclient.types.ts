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

export interface EndClientFormData {
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

export interface EndClientWithCount extends EndClient {
  employeeCount: number;
}
