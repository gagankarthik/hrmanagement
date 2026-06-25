import { apiClient } from '@/shared/lib/http/client';
import type { Client, ClientFormData } from '../domain/client.types';

const BASE = '/api/clients';

/** Browser-side data client for clients — the only place that knows the URLs. */
export const clientApi = {
  list: () => apiClient.get<Client[]>(BASE),
  create: (data: ClientFormData) => apiClient.post<Client>(BASE, data),
  update: (id: string, data: Partial<ClientFormData>) => apiClient.put<Client>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.del<{ message: string }>(`${BASE}/${id}`),
};
