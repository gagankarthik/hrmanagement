'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CategoryPolicy, SopDoc, SopFormData } from '@/types/handbook';
import { EmployeeType } from '@/types/employee';

interface HandbookContextType {
  policies: CategoryPolicy[];
  sops: SopDoc[];
  isLoading: boolean;
  error: string | null;
  fetchHandbook: () => Promise<void>;
  getPolicy: (type: EmployeeType) => CategoryPolicy;
  savePolicy: (policy: CategoryPolicy) => Promise<void>;
  createSop: (data: SopFormData) => Promise<void>;
  updateSop: (id: string, data: Partial<SopDoc>) => Promise<void>;
  deleteSop: (id: string) => Promise<void>;
}

const HandbookContext = createContext<HandbookContextType | undefined>(undefined);

export function HandbookProvider({ children }: { children: React.ReactNode }) {
  const [policies, setPolicies] = useState<CategoryPolicy[]>([]);
  const [sops, setSops] = useState<SopDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHandbook = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [pRes, sRes] = await Promise.all([
        fetch('/api/handbook/policies').then((r) => r.json()),
        fetch('/api/handbook/sops').then((r) => r.json()),
      ]);
      if (pRes.success) setPolicies(pRes.data || []);
      if (sRes.success) setSops(sRes.data || []);
      if (!pRes.success || !sRes.success) setError('Failed to load handbook');
    } catch (err) {
      console.error('Error fetching handbook:', err);
      setError('Failed to load handbook');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPolicy = useCallback(
    (type: EmployeeType): CategoryPolicy =>
      policies.find((p) => p.employeeType === type) ?? { employeeType: type, annualLeaveAllowance: 0 },
    [policies]
  );

  const savePolicy = useCallback(async (policy: CategoryPolicy) => {
    const res = await fetch('/api/handbook/policies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save policy');
    setPolicies((prev) => {
      const others = prev.filter((p) => p.employeeType !== policy.employeeType);
      return [...others, result.data];
    });
  }, []);

  const createSop = useCallback(async (data: SopFormData) => {
    const res = await fetch('/api/handbook/sops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to create document');
    setSops((prev) => [...prev, result.data]);
  }, []);

  const updateSop = useCallback(async (id: string, data: Partial<SopDoc>) => {
    const existing = sops.find((s) => s.id === id);
    const res = await fetch(`/api/handbook/sops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, ...data }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to update document');
    setSops((prev) => prev.map((s) => (s.id === id ? result.data : s)));
  }, [sops]);

  const deleteSop = useCallback(async (id: string) => {
    const res = await fetch(`/api/handbook/sops/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete document');
    setSops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    fetchHandbook();
  }, [fetchHandbook]);

  return (
    <HandbookContext.Provider
      value={{ policies, sops, isLoading, error, fetchHandbook, getPolicy, savePolicy, createSop, updateSop, deleteSop }}
    >
      {children}
    </HandbookContext.Provider>
  );
}

export function useHandbook() {
  const ctx = useContext(HandbookContext);
  if (ctx === undefined) throw new Error('useHandbook must be used within a HandbookProvider');
  return ctx;
}
