'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Attendance, AttendanceFormData } from '@/types/attendance';

interface AttendanceContextType {
  records: Attendance[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchAttendance: () => Promise<void>;
  createAttendance: (attendance: AttendanceFormData) => Promise<void>;
  updateAttendance: (id: string, attendance: Partial<AttendanceFormData>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  getAttendanceById: (id: string) => Attendance | undefined;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all attendance records
  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/attendance');
      const result = await response.json();

      if (result.success) {
        setRecords(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch attendance');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new attendance record
  const createAttendance = useCallback(async (attendanceData: AttendanceFormData) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      const result = await response.json();

      if (result.success) {
        setRecords((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create attendance');
      }
    } catch (err) {
      console.error('Error creating attendance:', err);
      throw err;
    }
  }, []);

  // Update existing attendance record
  const updateAttendance = useCallback(async (id: string, attendanceData: Partial<AttendanceFormData>) => {
    try {
      const existing = records.find((r) => r.id === id);
      if (!existing) {
        throw new Error('Attendance record not found');
      }

      const updatedData = {
        ...existing,
        ...attendanceData,
      };

      const response = await fetch(`/api/attendance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? result.data : r))
        );
      } else {
        throw new Error(result.error || 'Failed to update attendance');
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
      throw err;
    }
  }, [records]);

  // Delete attendance record
  const deleteAttendance = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete attendance');
      }
    } catch (err) {
      console.error('Error deleting attendance:', err);
      throw err;
    }
  }, []);

  // Get attendance record by ID
  const getAttendanceById = useCallback((id: string) => {
    return records.find((r) => r.id === id);
  }, [records]);

  // Fetch attendance on mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <AttendanceContext.Provider
      value={{
        records,
        isLoading,
        error,
        fetchAttendance,
        createAttendance,
        updateAttendance,
        deleteAttendance,
        getAttendanceById,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
