// End Client entity interface
export interface EndClient {
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

// End Client form data (for creation/editing)
export interface EndClientFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

// End Client with employee count (for dashboard display)
export interface EndClientWithCount extends EndClient {
  employeeCount: number;
}
