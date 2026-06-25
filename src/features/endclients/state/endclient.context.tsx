'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { endClientApi } from '../api/endclient.client';
import type { EndClient, EndClientFormData } from '../domain/endclient.types';

interface EndClientContextType {
  endClients: EndClient[];
  isLoading: boolean;
  error: string | null;
  fetchEndClients: () => Promise<void>;
  createEndClient: (endClient: EndClientFormData) => Promise<EndClient>;
  updateEndClient: (id: string, endClient: Partial<EndClientFormData>) => Promise<void>;
  deleteEndClient: (id: string) => Promise<void>;
  getEndClientById: (id: string) => EndClient | undefined;
}

const EndClientContext = createContext<EndClientContextType | undefined>(undefined);

export function EndClientProvider({ children }: { children: React.ReactNode }) {
  const [endClients, setEndClients] = useState<EndClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEndClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setEndClients(await endClientApi.list());
    } catch (err) {
      console.error('Error fetching end clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch end clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEndClient = useCallback(async (data: EndClientFormData) => {
    const created = await endClientApi.create(data);
    setEndClients((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEndClient = useCallback(async (id: string, data: Partial<EndClientFormData>) => {
    const updated = await endClientApi.update(id, data);
    setEndClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteEndClient = useCallback(async (id: string) => {
    await endClientApi.remove(id);
    setEndClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getEndClientById = useCallback((id: string) => endClients.find((c) => c.id === id), [endClients]);

  useEffect(() => { fetchEndClients(); }, [fetchEndClients]);

  return (
    <EndClientContext.Provider
      value={{ endClients, isLoading, error, fetchEndClients, createEndClient, updateEndClient, deleteEndClient, getEndClientById }}
    >
      {children}
    </EndClientContext.Provider>
  );
}

export function useEndClients() {
  const context = useContext(EndClientContext);
  if (context === undefined) throw new Error('useEndClients must be used within an EndClientProvider');
  return context;
}
