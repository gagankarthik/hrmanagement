'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Subcontractor, SubcontractorFormData } from '@/types/subcontractor';

interface SubcontractorContextType {
  subcontractors: Subcontractor[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchSubcontractors: () => Promise<void>;
  createSubcontractor: (subcontractor: SubcontractorFormData) => Promise<Subcontractor>;
  updateSubcontractor: (id: string, subcontractor: Partial<SubcontractorFormData>) => Promise<void>;
  deleteSubcontractor: (id: string) => Promise<void>;
  getSubcontractorById: (id: string) => Subcontractor | undefined;
}

const SubcontractorContext = createContext<SubcontractorContextType | undefined>(undefined);

export function SubcontractorProvider({ children }: { children: React.ReactNode }) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all subcontractors
  const fetchSubcontractors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subcontractors');
      const result = await response.json();

      if (result.success) {
        setSubcontractors(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch subcontractors');
      }
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
      setError('Failed to fetch subcontractors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new subcontractor
  const createSubcontractor = useCallback(async (subcontractorData: SubcontractorFormData) => {
    try {
      const response = await fetch('/api/subcontractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subcontractorData),
      });

      const result = await response.json();

      if (result.success) {
        setSubcontractors((prev) => [...prev, result.data]);
        return result.data as Subcontractor;
      } else {
        throw new Error(result.error || 'Failed to create subcontractor');
      }
    } catch (err) {
      console.error('Error creating subcontractor:', err);
      throw err;
    }
  }, []);

  // Update existing subcontractor
  const updateSubcontractor = useCallback(async (id: string, subcontractorData: Partial<SubcontractorFormData>) => {
    try {
      const existing = subcontractors.find((s) => s.id === id);
      if (!existing) {
        throw new Error('Subcontractor not found');
      }

      const updatedData = {
        ...existing,
        ...subcontractorData,
      };

      const response = await fetch(`/api/subcontractors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setSubcontractors((prev) =>
          prev.map((s) => (s.id === id ? result.data : s))
        );
      } else {
        throw new Error(result.error || 'Failed to update subcontractor');
      }
    } catch (err) {
      console.error('Error updating subcontractor:', err);
      throw err;
    }
  }, [subcontractors]);

  // Delete subcontractor
  const deleteSubcontractor = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/subcontractors/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSubcontractors((prev) => prev.filter((s) => s.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete subcontractor');
      }
    } catch (err) {
      console.error('Error deleting subcontractor:', err);
      throw err;
    }
  }, []);

  // Get subcontractor by ID
  const getSubcontractorById = useCallback((id: string) => {
    return subcontractors.find((s) => s.id === id);
  }, [subcontractors]);

  // Fetch subcontractors on mount
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
