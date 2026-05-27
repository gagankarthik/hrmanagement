'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { EmployeeDocsRecord } from '@/types/employee-docs';

interface EmployeeDocsContextType {
  records: EmployeeDocsRecord[];
  isLoading: boolean;
  fetchRecords: () => Promise<void>;
  getByEmployee: (employeeId: string) => EmployeeDocsRecord | undefined;
  saveRecord: (record: Partial<EmployeeDocsRecord> & { employeeId: string }) => Promise<EmployeeDocsRecord>;
  deleteRecord: (employeeId: string) => Promise<void>;
}

const EmployeeDocsContext = createContext<EmployeeDocsContextType | undefined>(undefined);

export function EmployeeDocsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<EmployeeDocsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employee-docs');
      const result = await res.json();
      if (result.success) setRecords(result.data || []);
    } catch (err) {
      console.error('Error fetching employee document records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getByEmployee = useCallback((employeeId: string) => records.find((r) => r.employeeId === employeeId), [records]);

  const saveRecord = useCallback(async (record: Partial<EmployeeDocsRecord> & { employeeId: string }) => {
    const res = await fetch('/api/employee-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save employee document record');
    setRecords((prev) => {
      const others = prev.filter((r) => r.employeeId !== record.employeeId);
      return [...others, result.data];
    });
    return result.data as EmployeeDocsRecord;
  }, []);

  const deleteRecord = useCallback(async (employeeId: string) => {
    const res = await fetch(`/api/employee-docs/${employeeId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete employee document record');
    setRecords((prev) => prev.filter((r) => r.employeeId !== employeeId));
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <EmployeeDocsContext.Provider value={{ records, isLoading, fetchRecords, getByEmployee, saveRecord, deleteRecord }}>
      {children}
    </EmployeeDocsContext.Provider>
  );
}

export function useEmployeeDocs() {
  const ctx = useContext(EmployeeDocsContext);
  if (ctx === undefined) throw new Error('useEmployeeDocs must be used within an EmployeeDocsProvider');
  return ctx;
}
