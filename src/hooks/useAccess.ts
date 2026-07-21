'use client';

import { useAuth } from '@/context/AuthContext';
import { hasFullAccess, isSelfServiceOnly, isAdmin } from '@/config/access';

/**
 * Role-derived UI capabilities for the signed-in user.
 *
 * `canManage` gates all create/edit/delete controls — full-access (admin/hr)
 * only. `selfServiceOnly` is true for recruiter/sales users who get the limited
 * read-only portal. `admin` gates admin-only surfaces (e.g. data backups).
 */
export function useAccess() {
  const { roles } = useAuth();
  const fullAccess = hasFullAccess(roles);
  return {
    fullAccess,
    canManage: fullAccess,
    selfServiceOnly: isSelfServiceOnly(roles),
    admin: isAdmin(roles),
  };
}
