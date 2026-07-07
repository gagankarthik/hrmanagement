'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { OnboardingPacket } from '@/types/onboarding';

interface OnboardingContextType {
  packets: OnboardingPacket[];
  isLoading: boolean;
  error: string | null;
  fetchPackets: () => Promise<void>;
  getByEmployee: (employeeId: string) => OnboardingPacket | undefined;
  savePacket: (packet: Partial<OnboardingPacket> & { employeeId: string }) => Promise<OnboardingPacket>;
  deletePacket: (employeeId: string) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [packets, setPackets] = useState<OnboardingPacket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/onboarding');
      const result = await res.json();
      if (result.success) setPackets(result.data || []);
      else setError(result.error || 'Failed to load onboarding packets');
    } catch (err) {
      console.error('Error fetching onboarding packets:', err);
      setError('Failed to load onboarding packets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getByEmployee = useCallback(
    (employeeId: string) => packets.find((p) => p.employeeId === employeeId),
    [packets],
  );

  const savePacket = useCallback(async (packet: Partial<OnboardingPacket> & { employeeId: string }) => {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to save onboarding packet');
    setPackets((prev) => {
      const others = prev.filter((p) => p.employeeId !== packet.employeeId);
      return [...others, result.data];
    });
    return result.data as OnboardingPacket;
  }, []);

  const deletePacket = useCallback(async (employeeId: string) => {
    const res = await fetch(`/api/onboarding/${employeeId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete onboarding packet');
    setPackets((prev) => prev.filter((p) => p.employeeId !== employeeId));
  }, []);

  useEffect(() => { fetchPackets(); }, [fetchPackets]);

  return (
    <OnboardingContext.Provider value={{ packets, isLoading, error, fetchPackets, getByEmployee, savePacket, deletePacket }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (ctx === undefined) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
