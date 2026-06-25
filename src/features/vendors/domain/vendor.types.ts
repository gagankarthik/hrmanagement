/**
 * Vendor domain types. Framework-free; `src/types/vendor.ts` re-exports these.
 */
export interface Vendor {
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

export interface VendorFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

export interface VendorWithCount extends Vendor {
  employeeCount: number;
}
