'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAccess } from './useAccess';

/**
 * Load company-management data once the session is known, and only for accounts
 * entitled to it.
 *
 * The API now scopes and refuses requests on its own, so this is not the
 * security boundary — it is least privilege at the client edge: a self-service
 * account never asks for client, vendor, invoice or immigration records it
 * cannot have, and the portal does not fire a wave of guaranteed 403s on every
 * sign-in. Waiting for `isLoading` to clear also stops the request going out
 * before we know who is asking.
 */
export function useManagementFetch(load: () => void | Promise<void>) {
  const { isLoading } = useAuth();
  const { selfServiceOnly } = useAccess();

  useEffect(() => {
    if (isLoading || selfServiceOnly) return;
    load();
  }, [isLoading, selfServiceOnly, load]);
}
