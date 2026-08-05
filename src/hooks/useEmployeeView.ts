'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * "Employee view" for admin and HR.
 *
 * Admins and HR are employees of the company too: they take leave, mark
 * attendance and have their own payslips. This flips the console into the same
 * self-service portal an employee sees, so they can use it and so they can tell
 * what their colleagues are actually looking at.
 *
 * It is a VIEW MODE, not a permission change. The session still carries admin
 * or hr, every API call still authorizes at full access, and nothing here is a
 * security boundary. Do not use it to reason about what someone may do; use
 * `useAccess()` for that. A self-service user has no use for it either, since
 * the ESS portal is already all they see.
 *
 * Persisted in localStorage so a refresh does not silently drop the user back
 * into the console, and broadcast so the sidebar and topbar stay in step
 * without threading state through the layout.
 */
const STORAGE_KEY = 'ob.employeeView';
const CHANGE_EVENT = 'ob:employee-view-change';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useEmployeeView() {
  // Always start false so the server render and the first client render agree;
  // the effect below corrects it immediately. Reading localStorage during the
  // initial render would hydrate-mismatch.
  const [employeeView, setState] = useState(false);

  useEffect(() => {
    setState(read());
    const sync = () => setState(read());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setEmployeeView = useCallback((next: boolean) => {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, '1');
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode — the mode still works for this render tree */
    }
    setState(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { employeeView, setEmployeeView };
}
