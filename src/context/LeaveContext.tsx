'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Leave, LeaveFormData } from '@/types/leave';

interface LeaveContextType {
  leaves: Leave[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchLeaves: () => Promise<void>;
  createLeave: (leave: LeaveFormData) => Promise<void>;
  updateLeave: (id: string, leave: Partial<Leave>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
  getLeaveById: (id: string) => Leave | undefined;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export function LeaveProvider({ children }: { children: React.ReactNode }) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all leaves
  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/leaves');
      const result = await response.json();

      if (result.success) {
        setLeaves(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch leaves');
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to fetch leaves');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new leave
  const createLeave = useCallback(async (leaveData: LeaveFormData) => {
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaveData),
      });

      const result = await response.json();

      if (result.success) {
        setLeaves((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create leave');
      }
    } catch (err) {
      console.error('Error creating leave:', err);
      throw err;
    }
  }, []);

  // Update existing leave
  const updateLeave = useCallback(async (id: string, leaveData: Partial<Leave>) => {
    try {
      const existing = leaves.find((l) => l.id === id);
      if (!existing) {
        throw new Error('Leave not found');
      }

      const updatedData = {
        ...existing,
        ...leaveData,
      };

      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setLeaves((prev) =>
          prev.map((l) => (l.id === id ? result.data : l))
        );
      } else {
        throw new Error(result.error || 'Failed to update leave');
      }
    } catch (err) {
      console.error('Error updating leave:', err);
      throw err;
    }
  }, [leaves]);

  // Delete leave
  const deleteLeave = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setLeaves((prev) => prev.filter((l) => l.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete leave');
      }
    } catch (err) {
      console.error('Error deleting leave:', err);
      throw err;
    }
  }, []);

  // Get leave by ID
  const getLeaveById = useCallback((id: string) => {
    return leaves.find((l) => l.id === id);
  }, [leaves]);

  // Fetch leaves on mount
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return (
    <LeaveContext.Provider
      value={{
        leaves,
        isLoading,
        error,
        fetchLeaves,
        createLeave,
        updateLeave,
        deleteLeave,
        getLeaveById,
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeaves() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeaves must be used within a LeaveProvider');
  }
  return context;
}
