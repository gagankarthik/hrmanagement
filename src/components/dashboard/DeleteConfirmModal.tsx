'use client';

import React, { useState } from 'react';
import { Employee } from '@/types/employee';
import { useEmployees } from '@/context/EmployeeContext';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { friendlyError } from '@/lib/errors';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

/**
 * Employee removal confirmation. Delegates to the shared, focus-trapped
 * ConfirmDialog (no bespoke modal, no dark-mode artifacts) and reassures the
 * user which records are left untouched.
 */
export default function DeleteConfirmModal({ isOpen, onClose, employee }: DeleteConfirmModalProps) {
  const { deleteEmployee } = useEmployees();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id);
      toast.success('Employee removed', `${employee.name} was removed from your workforce list.`);
      onClose();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Could not remove employee', friendlyError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!employee) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => !isDeleting && onClose()}
      onConfirm={handleDelete}
      tone="danger"
      title="Remove employee?"
      description={
        <>
          This removes <span className="font-semibold text-slate-900">{employee.name}</span>
          {employee.position ? <> ({employee.position})</> : null} from your workforce list.
        </>
      }
      reassurance="Documents, leave requests, timesheets and compliance records are stored separately and are not deleted by this action."
      confirmLabel="Remove employee"
      cancelLabel="Keep employee"
      isLoading={isDeleting}
    />
  );
}
