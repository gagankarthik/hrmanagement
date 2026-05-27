'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { I983Record } from '@/types/i983';

interface I983ContextType {
  records: I983Record[];
  isLoading: boolean;
  fetchRecords: () => Promise<void>;
  getByEmployee: (employeeId: string) => I983Record | undefined;
  saveRecord: (record: Partial<I983Record> & { employeeId: string }) => Promise<I983Record>;
  deleteRecord: (employeeId: string) => Promise<void>;
}

const I983Context = createContext<I983ContextType | undefined>(undefined);

export function I983Provider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<I983Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/i983');
      const result = await res.json();
      if (result.success) setRecords(result.data || []);
    } catch (err) {
      console.error('Error fetching I-983 records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getByEmployee = useCallback((employeeId: string) => records.find((r) => r.employeeId === employeeId), [records]);

  const saveRecord = useCallback(async (record: Partial<I983Record> & { employeeId: string }) => {
    const res = await fetch('/api/i983', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save I-983 record');
    setRecords((prev) => {
      const others = prev.filter((r) => r.employeeId !== record.employeeId);
      return [...others, result.data];
    });
    return result.data as I983Record;
  }, []);

  const deleteRecord = useCallback(async (employeeId: string) => {
    const res = await fetch(`/api/i983/${employeeId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete I-983 record');
    setRecords((prev) => prev.filter((r) => r.employeeId !== employeeId));
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <I983Context.Provider value={{ records, isLoading, fetchRecords, getByEmployee, saveRecord, deleteRecord }}>
      {children}
    </I983Context.Provider>
  );
}

export function useI983() {
  const ctx = useContext(I983Context);
  if (ctx === undefined) throw new Error('useI983 must be used within an I983Provider');
  return ctx;
}
