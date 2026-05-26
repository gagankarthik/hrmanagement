'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Invoice, InvoiceFormData } from '@/types/invoice';

interface InvoiceContextType {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: InvoiceFormData) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/invoices');
      const result = await res.json();
      if (result.success) setInvoices(result.data || []);
      else setError(result.error || 'Failed to fetch invoices');
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (data: InvoiceFormData) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to create invoice');
    setInvoices((prev) => [...prev, result.data]);
    return result.data as Invoice;
  }, []);

  const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to update invoice');
    setInvoices((prev) => prev.map((i) => (i.id === id ? result.data : i)));
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete invoice');
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const getInvoiceById = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <InvoiceContext.Provider
      value={{ invoices, isLoading, error, fetchInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceById }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (ctx === undefined) throw new Error('useInvoices must be used within an InvoiceProvider');
  return ctx;
}
