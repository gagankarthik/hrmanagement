import { apiClient } from '@/shared/lib/http/client';
import type { EndClient, EndClientFormData } from '../domain/endclient.types';

const BASE = '/api/endclients';

export const endClientApi = {
  list: () => apiClient.get<EndClient[]>(BASE),
  create: (data: EndClientFormData) => apiClient.post<EndClient>(BASE, data),
  update: (id: string, data: Partial<EndClientFormData>) => apiClient.put<EndClient>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.del<{ message: string }>(`${BASE}/${id}`),
};
