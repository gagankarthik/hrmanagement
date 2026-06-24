'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subcontractorApi } from '../api/subcontractor.client';
import type { Subcontractor, SubcontractorFormData } from '../domain/subcontractor.types';

/**
 * Subcontractor server-state holder. Thin by design — all transport lives in
 * `subcontractorApi`, all persistence rules in the server service. This context
 * only caches the list and keeps it in sync after mutations.
 */
interface SubcontractorContextType {
  subcontractors: Subcontractor[];
  isLoading: boolean;
  error: string | null;

  fetchSubcontractors: () => Promise<void>;
  createSubcontractor: (data: SubcontractorFormData) => Promise<Subcontractor>;
  updateSubcontractor: (id: string, data: Partial<SubcontractorFormData>) => Promise<void>;
  deleteSubcontractor: (id: string) => Promise<void>;
  getSubcontractorById: (id: string) => Subcontractor | undefined;
}

const SubcontractorContext = createContext<SubcontractorContextType | undefined>(undefined);

export function SubcontractorProvider({ children }: { children: React.ReactNode }) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubcontractors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSubcontractors(await subcontractorApi.list());
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subcontractors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubcontractor = useCallback(async (data: SubcontractorFormData) => {
    const created = await subcontractorApi.create(data);
    setSubcontractors((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSubcontractor = useCallback(async (id: string, data: Partial<SubcontractorFormData>) => {
    const updated = await subcontractorApi.update(id, data);
    setSubcontractors((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const deleteSubcontractor = useCallback(async (id: string) => {
    await subcontractorApi.remove(id);
    setSubcontractors((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSubcontractorById = useCallback(
    (id: string) => subcontractors.find((s) => s.id === id),
    [subcontractors],
  );

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  return (
    <SubcontractorContext.Provider
      value={{
        subcontractors,
        isLoading,
        error,
        fetchSubcontractors,
        createSubcontractor,
        updateSubcontractor,
        deleteSubcontractor,
        getSubcontractorById,
      }}
    >
      {children}
    </SubcontractorContext.Provider>
  );
}

export function useSubcontractors() {
  const context = useContext(SubcontractorContext);
  if (context === undefined) {
    throw new Error('useSubcontractors must be used within a SubcontractorProvider');
  }
  return context;
}
