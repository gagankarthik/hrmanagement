'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Employee,
  EmployeeFilters,
  DashboardStats,
} from '@/types/employee';
import { employeeApi } from '@/features/employees/api/employee.client';
import { computeDashboardStats, filterEmployees } from '@/features/employees/domain/employee.stats';
import { exportEmployees } from '@/features/employees/domain/employee.export';

interface EmployeeContextType {
  employees: Employee[];
  filteredEmployees: Employee[];
  isLoading: boolean;
  error: string | null;
  filters: EmployeeFilters;
  stats: DashboardStats;

  // CRUD Operations
  fetchEmployees: () => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;

  // Filter Operations
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  resetFilters: () => void;

  // Export
  exportData: (format: 'csv' | 'json') => void;
}

const defaultFilters: EmployeeFilters = {
  type: 'All',
  status: 'All',
  state: '',
  searchQuery: '',
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EmployeeFilters>(defaultFilters);

  // Filtered list + dashboard stats — pure logic lives in the domain layer.
  const filteredEmployees = React.useMemo(() => filterEmployees(employees, filters), [employees, filters]);
  const stats: DashboardStats = React.useMemo(() => computeDashboardStats(employees), [employees]);

  // Fetch employees (transport in employeeApi; CRUD mutations sync local cache)
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEmployees(await employeeApi.list());
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      const created = await employeeApi.create(employeeData);
      setEmployees((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      throw err;
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setError(null);
    try {
      const updated = await employeeApi.update(id, updates);
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? updated : emp)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setError(null);
    try {
      await employeeApi.remove(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      throw err;
    }
  }, []);

  // Get employee by ID
  const getEmployeeById = useCallback(
    (id: string) => {
      return employees.find((emp) => emp.id === id);
    },
    [employees]
  );

  // Set filters
  const setFilters = useCallback((newFilters: Partial<EmployeeFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // Export the current filtered view (CSV/JSON) — implementation in the domain layer.
  const exportData = useCallback(
    (format: 'csv' | 'json') => exportEmployees(filteredEmployees, format),
    [filteredEmployees]
  );

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const value: EmployeeContextType = {
    employees,
    filteredEmployees,
    isLoading,
    error,
    filters,
    stats,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    setFilters,
    resetFilters,
    exportData,
  };

  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
}
