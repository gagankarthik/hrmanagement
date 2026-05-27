'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { I9Record } from '@/types/i9';

interface I9ContextType {
  records: I9Record[];
  isLoading: boolean;
  fetchRecords: () => Promise<void>;
  getByEmployee: (employeeId: string) => I9Record | undefined;
  saveRecord: (record: Partial<I9Record> & { employeeId: string }) => Promise<I9Record>;
  deleteRecord: (employeeId: string) => Promise<void>;
}

const I9Context = createContext<I9ContextType | undefined>(undefined);

export function I9Provider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<I9Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/i9');
      const result = await res.json();
      if (result.success) setRecords(result.data || []);
    } catch (err) {
      console.error('Error fetching I-9 records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getByEmployee = useCallback((employeeId: string) => records.find((r) => r.employeeId === employeeId), [records]);

  const saveRecord = useCallback(async (record: Partial<I9Record> & { employeeId: string }) => {
    const res = await fetch('/api/i9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save I-9 record');
    setRecords((prev) => {
      const others = prev.filter((r) => r.employeeId !== record.employeeId);
      return [...others, result.data];
    });
    return result.data as I9Record;
  }, []);

  const deleteRecord = useCallback(async (employeeId: string) => {
    const res = await fetch(`/api/i9/${employeeId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete I-9 record');
    setRecords((prev) => prev.filter((r) => r.employeeId !== employeeId));
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <I9Context.Provider value={{ records, isLoading, fetchRecords, getByEmployee, saveRecord, deleteRecord }}>
      {children}
    </I9Context.Provider>
  );
}

export function useI9() {
  const ctx = useContext(I9Context);
  if (ctx === undefined) throw new Error('useI9 must be used within an I9Provider');
  return ctx;
}
