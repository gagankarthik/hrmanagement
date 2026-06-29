'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/context/EmployeeContext';

/**
 * Resolves the employee record that belongs to the signed-in user by matching
 * their Cognito login email against the employee's office / personal email.
 * Used by the self-service leave portal so recruiter/sales users act only on
 * their own record. Returns `undefined` when no matching profile exists.
 */
export function useSelfEmployee() {
  const { user } = useAuth();
  const { employees } = useEmployees();

  const email = user?.email?.toLowerCase().trim();

  return useMemo(() => {
    if (!email) return undefined;
    return employees.find((e) => {
      // `officeEmail` exists on every employee type except Contract.
      const office = 'officeEmail' in e ? e.officeEmail : undefined;
      return [office, e.personalEmail].some((x) => x?.toLowerCase().trim() === email);
    });
  }, [email, employees]);
}
