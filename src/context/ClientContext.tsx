'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Client, ClientFormData } from '@/types/client';

interface ClientContextType {
  clients: Client[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchClients: () => Promise<void>;
  createClient: (client: ClientFormData) => Promise<void>;
  updateClient: (id: string, client: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/clients');
      const result = await response.json();

      if (result.success) {
        setClients(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch clients');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new client
  const createClient = useCallback(async (clientData: ClientFormData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      const result = await response.json();

      if (result.success) {
        setClients((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      throw err;
    }
  }, []);

  // Update existing client
  const updateClient = useCallback(async (id: string, clientData: Partial<ClientFormData>) => {
    try {
      const existingClient = clients.find((c) => c.id === id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      const updatedData = {
        ...existingClient,
        ...clientData,
      };

      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? result.data : c))
        );
      } else {
        throw new Error(result.error || 'Failed to update client');
      }
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  }, [clients]);

  // Delete client
  const deleteClient = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  }, []);

  // Get client by ID
  const getClientById = useCallback((id: string) => {
    return clients.find((c) => c.id === id);
  }, [clients]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        isLoading,
        error,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
        getClientById,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}
