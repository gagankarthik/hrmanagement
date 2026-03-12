'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Employee,
  EmployeeFilters,
  DashboardStats,
} from '@/types/employee';

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

  // Calculate filtered employees
  const filteredEmployees = React.useMemo(() => {
    return employees.filter((employee) => {
      // Type filter
      if (filters.type !== 'All' && employee.type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status !== 'All') {
        if ('status' in employee && employee.status !== filters.status) {
          return false;
        }
      }

      // State filter
      if (filters.state && employee.state.toLowerCase() !== filters.state.toLowerCase()) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableFields = [
          employee.name,
          employee.position,
          employee.personalEmail,
          'officeEmail' in employee ? employee.officeEmail : '',
          'endClient' in employee ? employee.endClient : '',
          'client' in employee ? employee.client : '',
          employee.vendorName,
        ];
        return searchableFields.some((field) => field?.toLowerCase().includes(query));
      }

      return true;
    });
  }, [employees, filters]);

  // Calculate statistics
  const stats: DashboardStats = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringCount = employees.filter((emp) => {
      if (!emp.expiryDate) return false;
      const expiry = new Date(emp.expiryDate);
      return expiry > now && expiry <= thirtyDaysFromNow;
    }).length;

    return {
      totalEmployees: employees.length,
      w2Count: employees.filter((e) => e.type === 'W2').length,
      contractCount: employees.filter((e) => e.type === 'Contract').length,
      employee1099Count: employees.filter((e) => e.type === '1099').length,
      offshoreCount: employees.filter((e) => e.type === 'Offshore').length,
      activeCount: employees.filter((e) => 'status' in e && e.status === 'Active').length,
      terminatedCount: employees.filter((e) => 'status' in e && e.status === 'Terminated').length,
      expiringAuthorizations: expiringCount,
    };
  }, [employees]);

  // Fetch employees from API
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/employees');
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create employee via API
  const createEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError(null);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (result.success) {
        setEmployees((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create employee');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      throw err;
    }
  }, []);

  // Update employee via API
  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setError(null);

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? result.data : emp))
        );
      } else {
        throw new Error(result.error || 'Failed to update employee');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    }
  }, []);

  // Delete employee via API
  const deleteEmployee = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete employee');
      }
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

  // Export data
  const exportData = useCallback(
    (format: 'csv' | 'json') => {
      const dataToExport = filteredEmployees;

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        const headers = Object.keys(dataToExport[0] || {}).join(',');
        const rows = dataToExport.map((emp) =>
          Object.values(emp)
            .map((val) => {
              if (typeof val === 'string' && val.includes(',')) {
                return `"${val}"`;
              }
              return val;
            })
            .join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
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
