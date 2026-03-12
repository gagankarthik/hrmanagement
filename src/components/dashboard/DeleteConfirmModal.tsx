'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Employee } from '@/types/employee';
import { useEmployees } from '@/context/EmployeeContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  employee,
}: DeleteConfirmModalProps) {
  const { deleteEmployee } = useEmployees();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!employee) return;

    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
            Delete Employee
          </h3>

          {/* Message */}
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {employee.name}
            </span>
            ? This action cannot be undone.
          </p>

          {/* Employee Info */}
          <div className="mt-4 w-full rounded-lg bg-slate-50 p-3 text-left dark:bg-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Type:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {employee.type}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Position:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {employee.position}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Email:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {employee.personalEmail}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Deleting...
                </span>
              ) : (
                'Delete Employee'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
