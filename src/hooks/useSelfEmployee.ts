'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/context/EmployeeContext';

/**
 * Resolves the employee record that belongs to the signed-in user.
 *
 * The company website and this portal share one Cognito pool, so a login is not
 * automatically a person in the HR database. The match runs in the same order
 * the server uses (see shared/server/auth/self.ts): the immutable Cognito user
 * id recorded on the employee record, then the recorded sign-in email, then the
 * employee's office / personal email. Returns `undefined` when this account has
 * no employee profile yet — a real case for website-only accounts, which the
 * self-service pages explain rather than fail on.
 */
export function useSelfEmployee() {
  const { user } = useAuth();
  const { employees } = useEmployees();

  const email = user?.email?.toLowerCase().trim();
  const sub = user?.userId;

  return useMemo(() => {
    if (!sub && !email) return undefined;
    const bySub = sub ? employees.find((e) => e.cognitoSub === sub) : undefined;
    if (bySub) return bySub;
    if (!email) return undefined;
    return employees.find((e) => {
      if (e.loginEmail?.toLowerCase().trim() === email) return true;
      // `officeEmail` exists on every employee type except Contract.
      const office = 'officeEmail' in e ? e.officeEmail : undefined;
      return [office, e.personalEmail].some((x) => x?.toLowerCase().trim() === email);
    });
  }, [email, sub, employees]);
}
