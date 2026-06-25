import { apiClient } from '@/shared/lib/http/client';
import type { Vendor, VendorFormData } from '../domain/vendor.types';

const BASE = '/api/vendors';

export const vendorApi = {
  list: () => apiClient.get<Vendor[]>(BASE),
  create: (data: VendorFormData) => apiClient.post<Vendor>(BASE, data),
  update: (id: string, data: Partial<VendorFormData>) => apiClient.put<Vendor>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.del<{ message: string }>(`${BASE}/${id}`),
};
