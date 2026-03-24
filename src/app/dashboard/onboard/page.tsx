'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import {
  EmployeeType,
  FormField,
  getFieldsByType,
} from '@/types/employee';
import Link from 'next/link';

const employeeTypes: { value: EmployeeType; label: string; description: string }[] = [
  { value: 'W2', label: 'W2 Employee', description: 'Full-time employees with benefits' },
  { value: 'Contract', label: 'Contract', description: 'Temporary contract workers' },
  { value: '1099', label: '1099', description: 'Independent contractors' },
  { value: 'Offshore', label: 'Offshore', description: 'International remote employees' },
];

export default function OnboardPage() {
  const router = useRouter();
  const { createEmployee } = useEmployees();
  const { clients, isLoading: clientsLoading, fetchClients } = useClients();
  const { vendors, isLoading: vendorsLoading, fetchVendors } = useVendors();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<EmployeeType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch clients and vendors on mount
  useEffect(() => {
    fetchClients();
    fetchVendors();
  }, [fetchClients, fetchVendors]);

  // Populate client and vendor options
  const fields = useMemo(() => {
    if (!selectedType) return [];

    return getFieldsByType(selectedType).map(field => {
      if (field.name === 'clientId') {
        const options = clients
          .filter(c => c && c.id && c.name)
          .map(c => ({ value: c.id, label: c.name }));
        return { ...field, options };
      }
      if (field.name === 'vendorId') {
        const options = vendors
          .filter(v => v && v.id && v.name)
          .map(v => ({ value: v.id, label: v.name }));
        return { ...field, options };
      }
      return field;
    });
  }, [selectedType, clients, vendors]);

  const handleTypeSelect = (type: EmployeeType) => {
    setSelectedType(type);
    setFormData({ type });
    setStep(2);
  };

  const handleInputChange = (field: FormField, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field.name]: value }));
    if (errors[field.name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }

      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.name]))) {
          newErrors[field.name] = 'Invalid email format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createEmployee(formData as Parameters<typeof createEmployee>[0]);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/employees');
      }, 1500);
    } catch (error) {
      console.error('Error creating employee:', error);
      setErrors({ submit: 'Failed to create employee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];

    const baseInputClasses = cn(
      'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      'dark:bg-slate-800 dark:text-white',
      error
        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
        : 'border-slate-200 bg-white dark:border-slate-700'
    );

    switch (field.type) {
      case 'select':
        const isLoadingData = (field.name === 'clientId' && clientsLoading) ||
                             (field.name === 'vendorId' && vendorsLoading);
        const hasNoData = field.options && field.options.length === 0;

        return (
          <select
            value={String(value)}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={isLoadingData}
            className={baseInputClasses}
          >
            <option value="">
              {isLoadingData
                ? `Loading ${field.label.toLowerCase()}...`
                : hasNoData
                ? `No ${field.label.toLowerCase()} available`
                : `Select ${field.label}`}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field, e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{field.label}</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleInputChange(field, e.target.valueAsNumber || '')}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={String(value)}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Employee Added Successfully!
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Redirecting to employees list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/employees"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <UserPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Onboard New Employee
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {step === 1 ? 'Select employee type to get started' : `Adding ${selectedType} employee`}
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex items-center gap-2',
          step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
        )}>
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
            step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
          )}>
            1
          </div>
          <span className="text-sm font-medium">Select Type</span>
        </div>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <div className={cn(
          'flex items-center gap-2',
          step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
        )}>
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
            step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
          )}>
            2
          </div>
          <span className="text-sm font-medium">Employee Details</span>
        </div>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {employeeTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeSelect(type.value)}
              className="group rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 transition-colors group-hover:bg-indigo-500 dark:bg-indigo-900/30">
                <UserPlus className="h-6 w-6 text-indigo-600 transition-colors group-hover:text-white dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {type.label}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Employee Form */}
      {step === 2 && selectedType && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {selectedType} Employee Details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedType(null);
                  setFormData({});
                  setErrors({});
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Change Type
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <div key={field.name} className={field.type === 'checkbox' ? 'flex items-end' : ''}>
                  {field.type !== 'checkbox' && (
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                  )}
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>

            {errors.submit && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/dashboard/employees"
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
