import { apiClient } from '@/shared/lib/http/client';
import type { Employee } from '@/types/employee';

const BASE = '/api/employees';

/** Browser-side data client for employees — the only place that knows the URLs. */
export const employeeApi = {
  list: () => apiClient.get<Employee[]>(BASE),
  create: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => apiClient.post<Employee>(BASE, data),
  update: (id: string, data: Partial<Employee>) => apiClient.put<Employee>(`${BASE}/${id}`, data),
  remove: (id: string) => apiClient.del<{ message: string }>(`${BASE}/${id}`),
};
