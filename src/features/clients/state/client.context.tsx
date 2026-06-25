'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { clientApi } from '../api/client.client';
import type { Client, ClientFormData } from '../domain/client.types';

/** Thin client server-state holder — transport lives in `clientApi`, rules in the service. */
interface ClientContextType {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (client: ClientFormData) => Promise<Client>;
  updateClient: (id: string, client: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setClients(await clientApi.list());
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data: ClientFormData) => {
    const created = await clientApi.create(data);
    setClients((prev) => [...prev, created]);
    return created;
  }, []);

  const updateClient = useCallback(async (id: string, data: Partial<ClientFormData>) => {
    const updated = await clientApi.update(id, data);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await clientApi.remove(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getClientById = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return (
    <ClientContext.Provider
      value={{ clients, isLoading, error, fetchClients, createClient, updateClient, deleteClient, getClientById }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (context === undefined) throw new Error('useClients must be used within a ClientProvider');
  return context;
}
