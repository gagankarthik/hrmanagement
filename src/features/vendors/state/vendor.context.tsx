'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { vendorApi } from '../api/vendor.client';
import type { Vendor, VendorFormData } from '../domain/vendor.types';

interface VendorContextType {
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;
  fetchVendors: () => Promise<void>;
  createVendor: (vendor: VendorFormData) => Promise<Vendor>;
  updateVendor: (id: string, vendor: Partial<VendorFormData>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  getVendorById: (id: string) => Vendor | undefined;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setVendors(await vendorApi.list());
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVendor = useCallback(async (data: VendorFormData) => {
    const created = await vendorApi.create(data);
    setVendors((prev) => [...prev, created]);
    return created;
  }, []);

  const updateVendor = useCallback(async (id: string, data: Partial<VendorFormData>) => {
    const updated = await vendorApi.update(id, data);
    setVendors((prev) => prev.map((v) => (v.id === id ? updated : v)));
  }, []);

  const deleteVendor = useCallback(async (id: string) => {
    await vendorApi.remove(id);
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const getVendorById = useCallback((id: string) => vendors.find((v) => v.id === id), [vendors]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  return (
    <VendorContext.Provider
      value={{ vendors, isLoading, error, fetchVendors, createVendor, updateVendor, deleteVendor, getVendorById }}
    >
      {children}
    </VendorContext.Provider>
  );
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (context === undefined) throw new Error('useVendors must be used within a VendorProvider');
  return context;
}
