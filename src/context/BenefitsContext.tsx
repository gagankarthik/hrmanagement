'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BenefitPlan, BenefitFormData } from '@/types/benefits';

interface BenefitsContextType {
  plans: BenefitPlan[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchBenefits: () => Promise<void>;
  createBenefit: (benefit: BenefitFormData) => Promise<void>;
  updateBenefit: (id: string, benefit: Partial<BenefitFormData>) => Promise<void>;
  deleteBenefit: (id: string) => Promise<void>;
  getBenefitById: (id: string) => BenefitPlan | undefined;
}

const BenefitsContext = createContext<BenefitsContextType | undefined>(undefined);

export function BenefitsProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all benefit plans
  const fetchBenefits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/benefits');
      const result = await response.json();

      if (result.success) {
        setPlans(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch benefits');
      }
    } catch (err) {
      console.error('Error fetching benefits:', err);
      setError('Failed to fetch benefits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new benefit plan
  const createBenefit = useCallback(async (benefitData: BenefitFormData) => {
    try {
      const response = await fetch('/api/benefits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(benefitData),
      });

      const result = await response.json();

      if (result.success) {
        setPlans((prev) => [...prev, result.data]);
      } else {
        throw new Error(result.error || 'Failed to create benefit');
      }
    } catch (err) {
      console.error('Error creating benefit:', err);
      throw err;
    }
  }, []);

  // Update existing benefit plan
  const updateBenefit = useCallback(async (id: string, benefitData: Partial<BenefitFormData>) => {
    try {
      const existing = plans.find((p) => p.id === id);
      if (!existing) {
        throw new Error('Benefit not found');
      }

      const updatedData = {
        ...existing,
        ...benefitData,
      };

      const response = await fetch(`/api/benefits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (result.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? result.data : p))
        );
      } else {
        throw new Error(result.error || 'Failed to update benefit');
      }
    } catch (err) {
      console.error('Error updating benefit:', err);
      throw err;
    }
  }, [plans]);

  // Delete benefit plan
  const deleteBenefit = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/benefits/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete benefit');
      }
    } catch (err) {
      console.error('Error deleting benefit:', err);
      throw err;
    }
  }, []);

  // Get benefit plan by ID
  const getBenefitById = useCallback((id: string) => {
    return plans.find((p) => p.id === id);
  }, [plans]);

  // Fetch benefits on mount
  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  return (
    <BenefitsContext.Provider
      value={{
        plans,
        isLoading,
        error,
        fetchBenefits,
        createBenefit,
        updateBenefit,
        deleteBenefit,
        getBenefitById,
      }}
    >
      {children}
    </BenefitsContext.Provider>
  );
}

export function useBenefits() {
  const context = useContext(BenefitsContext);
  if (context === undefined) {
    throw new Error('useBenefits must be used within a BenefitsProvider');
  }
  return context;
}
