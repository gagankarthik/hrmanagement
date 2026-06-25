import 'server-only';
import { bulkCreateEmployees } from '@/lib/bulk-import/server';
import { employeeRepository } from './employee.repository';
import type { Employee, EmployeeType } from '@/types/employee';

/**
 * Employee application service. `list(type)` mirrors the old route's optional
 * `?type=` filter (same output as the per-type GSI query). Create is a
 * pass-through (the form supplies all classification-specific fields) to keep
 * behavior identical to the previous handler.
 */
export const employeeService = {
  async list(type?: string | null): Promise<Employee[]> {
    const all = await employeeRepository.list();
    return type && type !== 'All' ? all.filter((e) => e.type === (type as EmployeeType)) : all;
  },
  get(id: string): Promise<Employee> {
    return employeeRepository.getOrThrow(id);
  },
  create(input: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    return employeeRepository.create(input);
  },
  update(id: string, patch: Partial<Employee>): Promise<Employee> {
    return employeeRepository.update(id, patch);
  },
  remove(id: string): Promise<void> {
    return employeeRepository.remove(id);
  },
  bulkImport(rows: unknown[]) {
    return bulkCreateEmployees(rows as Record<string, unknown>[]);
  },
};
