// Vendor entity interface
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

// Vendor form data (for creation/editing)
export interface VendorFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

// Vendor with employee count (for dashboard display)
export interface VendorWithCount extends Vendor {
  employeeCount: number;
}
