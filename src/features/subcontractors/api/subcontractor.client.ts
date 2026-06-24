import { apiClient } from '@/shared/lib/http/client';
import type { Subcontractor, SubcontractorFormData } from '../domain/subcontractor.types';

const BASE = '/api/subcontractors';

/**
 * Browser-side data client for subcontractors. The only place that knows the
 * `/api/subcontractors` URLs. Throws on failure (handled by the shared
 * apiClient), so the context uses plain try/catch.
 */
export const subcontractorApi = {
  list: () => apiClient.get<Subcontractor[]>(BASE),
  create: (data: SubcontractorFormData) => apiClient.post<Subcontractor>(BASE, data),
  update: (id: string, data: Partial<SubcontractorFormData>) =>
    apiClient.put<Subcontractor>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.del<{ message: string }>(`${BASE}/${id}`),
};
