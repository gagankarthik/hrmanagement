'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { EndClient, EndClientFormData } from '@/types/endclient';

interface EndClientContextType {
  endClients: EndClient[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchEndClients: () => Promise<void>;
  createEndClient: (endClient: EndClientFormData) => Promise<void>;
  updateEndClient: (id: string, endClient: Partial<EndClientFormData>) => Promise<void>;
  deleteEndClient: (id: string) => Promise<void>;
  getEndClientById: (id: string) => EndClient | undefined;
}

const EndClientContext = createContext<EndClientContextType | undefined>(undefined);

export function EndClientProvider({ children }: { children: React.ReactNode }) {
  const [endClients, setEndClients] = useState<EndClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all end clients
  const fetchEndClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/endclients');
      const result = await response.json();

      if (result.success) {
        setEndClients(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch end clients');
      }
    } catch (err) {
      console.error('Error fetching end clients:', err);
      setError('Failed to fetch end clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new end client
  const createEndClient = useCallback(async (endClientData: EndClientFormData) => {
    try {
      const response = await fetch('/api/endclients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endClientData),
      });

      const result = await response.json();

      if (result.success) {
        setEndClients((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create end client');
      }
    } catch (err) {
      console.error('Error creating end client:', err);
      throw err;
    }
  }, []);

  // Update existing end client
  const updateEndClient = useCallback(async (id: string, endClientData: Partial<EndClientFormData>) => {
    try {
      const existingEndClient = endClients.find((c) => c.id === id);
      if (!existingEndClient) {
        throw new Error('End client not found');
      }

      const updatedData = {
        ...existingEndClient,
        ...endClientData,
      };

      const response = await fetch(`/api/endclients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setEndClients((prev) =>
          prev.map((c) => (c.id === id ? result.data : c))
        );
      } else {
        throw new Error(result.error || 'Failed to update end client');
      }
    } catch (err) {
      console.error('Error updating end client:', err);
      throw err;
    }
  }, [endClients]);

  // Delete end client
  const deleteEndClient = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/endclients/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setEndClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete end client');
      }
    } catch (err) {
      console.error('Error deleting end client:', err);
      throw err;
    }
  }, []);

  // Get end client by ID
  const getEndClientById = useCallback((id: string) => {
    return endClients.find((c) => c.id === id);
  }, [endClients]);

  // Fetch end clients on mount
  useEffect(() => {
    fetchEndClients();
  }, [fetchEndClients]);

  return (
    <EndClientContext.Provider
      value={{
        endClients,
        isLoading,
        error,
        fetchEndClients,
        createEndClient,
        updateEndClient,
        deleteEndClient,
        getEndClientById,
      }}
    >
      {children}
    </EndClientContext.Provider>
  );
}

export function useEndClients() {
  const context = useContext(EndClientContext);
  if (context === undefined) {
    throw new Error('useEndClients must be used within an EndClientProvider');
  }
  return context;
}
