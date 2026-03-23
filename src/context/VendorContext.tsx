'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Vendor, VendorFormData } from '@/types/vendor';

interface VendorContextType {
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchVendors: () => Promise<void>;
  createVendor: (vendor: VendorFormData) => Promise<void>;
  updateVendor: (id: string, vendor: Partial<VendorFormData>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  getVendorById: (id: string) => Vendor | undefined;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all vendors
  const fetchVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/vendors');
      const result = await response.json();

      if (result.success) {
        setVendors(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch vendors');
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new vendor
  const createVendor = useCallback(async (vendorData: VendorFormData) => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      });

      const result = await response.json();

      if (result.success) {
        setVendors((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create vendor');
      }
    } catch (err) {
      console.error('Error creating vendor:', err);
      throw err;
    }
  }, []);

  // Update existing vendor
  const updateVendor = useCallback(async (id: string, vendorData: Partial<VendorFormData>) => {
    try {
      const existingVendor = vendors.find((v) => v.id === id);
      if (!existingVendor) {
        throw new Error('Vendor not found');
      }

      const updatedData = {
        ...existingVendor,
        ...vendorData,
      };

      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setVendors((prev) =>
          prev.map((v) => (v.id === id ? result.data : v))
        );
      } else {
        throw new Error(result.error || 'Failed to update vendor');
      }
    } catch (err) {
      console.error('Error updating vendor:', err);
      throw err;
    }
  }, [vendors]);

  // Delete vendor
  const deleteVendor = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setVendors((prev) => prev.filter((v) => v.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete vendor');
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      throw err;
    }
  }, []);

  // Get vendor by ID
  const getVendorById = useCallback((id: string) => {
    return vendors.find((v) => v.id === id);
  }, [vendors]);

  // Fetch vendors on mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return (
    <VendorContext.Provider
      value={{
        vendors,
        isLoading,
        error,
        fetchVendors,
        createVendor,
        updateVendor,
        deleteVendor,
        getVendorById,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendors must be used within a VendorProvider');
  }
  return context;
}
