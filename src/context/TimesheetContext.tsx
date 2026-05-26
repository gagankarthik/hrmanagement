'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Timesheet, TimesheetFormData } from '@/types/timesheet';

interface TimesheetContextType {
  timesheets: Timesheet[];
  isLoading: boolean;
  error: string | null;
  fetchTimesheets: () => Promise<void>;
  createTimesheet: (data: TimesheetFormData & { employeeName: string; clientName?: string }) => Promise<Timesheet>;
  updateTimesheet: (id: string, data: Partial<Timesheet>) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
  getTimesheetById: (id: string) => Timesheet | undefined;
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

export function TimesheetProvider({ children }: { children: React.ReactNode }) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/timesheets');
      const result = await res.json();
      if (result.success) setTimesheets(result.data || []);
      else setError(result.error || 'Failed to fetch timesheets');
    } catch (err) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to fetch timesheets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTimesheet = useCallback(async (data: TimesheetFormData & { employeeName: string; clientName?: string }) => {
    const res = await fetch('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to create timesheet');
    setTimesheets((prev) => [...prev, result.data]);
    return result.data as Timesheet;
  }, []);

  const updateTimesheet = useCallback(async (id: string, data: Partial<Timesheet>) => {
    const res = await fetch(`/api/timesheets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to update timesheet');
    setTimesheets((prev) => prev.map((t) => (t.id === id ? result.data : t)));
  }, []);

  const deleteTimesheet = useCallback(async (id: string) => {
    const res = await fetch(`/api/timesheets/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete timesheet');
    setTimesheets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTimesheetById = useCallback((id: string) => timesheets.find((t) => t.id === id), [timesheets]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  return (
    <TimesheetContext.Provider
      value={{ timesheets, isLoading, error, fetchTimesheets, createTimesheet, updateTimesheet, deleteTimesheet, getTimesheetById }}
    >
      {children}
    </TimesheetContext.Provider>
  );
}

export function useTimesheets() {
  const ctx = useContext(TimesheetContext);
  if (ctx === undefined) throw new Error('useTimesheets must be used within a TimesheetProvider');
  return ctx;
}
