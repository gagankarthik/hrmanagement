'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * User UI preferences (persisted to localStorage), applied app-wide.
 *
 * - density: 'comfortable' (default) | 'compact'. Implemented by scaling the
 *   root font-size — the whole rem-based UI tightens proportionally, which is
 *   the data-dense mode enterprise users expect.
 */
export type Density = 'comfortable' | 'compact';

const DENSITY_KEY = 'ob:density';
const ROOT_FONT_PX: Record<Density, string> = { comfortable: '15px', compact: '13px' };

interface PreferencesValue {
  density: Density;
  setDensity: (d: Density) => void;
}

const PreferencesContext = createContext<PreferencesValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>('comfortable');

  // Hydrate from storage once.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DENSITY_KEY);
      if (stored === 'compact' || stored === 'comfortable') setDensityState(stored);
    } catch { /* ignore */ }
  }, []);

  // Apply to the document root.
  useEffect(() => {
    document.documentElement.style.fontSize = ROOT_FONT_PX[density];
  }, [density]);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    try { localStorage.setItem(DENSITY_KEY, d); } catch { /* ignore */ }
  }, []);

  return (
    <PreferencesContext.Provider value={{ density, setDensity }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
