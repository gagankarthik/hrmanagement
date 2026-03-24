'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import {
  Employee,
  EmployeeType,
  FormField,
  getFieldsByType,
  W2Employee,
  ContractEmployee,
  Employee1099,
  OffshoreEmployee,
} from '@/types/employee';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  employee?: Employee;
  defaultType?: EmployeeType;
}

const employeeTypes: { value: EmployeeType; label: string }[] = [
  { value: 'W2', label: 'W2 Employee' },
  { value: 'Contract', label: 'Contract' },
  { value: '1099', label: '1099' },
  { value: 'Offshore', label: 'Offshore' },
];

export default function EmployeeModal({
  isOpen,
  onClose,
  mode,
  employee,
  defaultType = 'W2',
}: EmployeeModalProps) {
  const { createEmployee, updateEmployee } = useEmployees();
  const { clients, isLoading: clientsLoading, fetchClients } = useClients();
  const { vendors, isLoading: vendorsLoading, fetchVendors } = useVendors();
  const [selectedType, setSelectedType] = useState<EmployeeType>(defaultType);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure clients and vendors are loaded when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchVendors();
    }
  }, [isOpen, fetchClients, fetchVendors]);

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      if (employee) {
        setSelectedType(employee.type);
        setFormData({ ...employee });
      }
    } else {
      setFormData({ type: selectedType });
    }
  }, [mode, employee, selectedType]);

  // Get fields for selected type and populate client/vendor options
  const fields = useMemo(() => {
    console.log('[EmployeeModal] Computing fields:', {
      selectedType,
      clientsCount: clients.length,
      vendorsCount: vendors.length,
      clientsData: clients,
      vendorsData: vendors,
      mode
    });

    return getFieldsByType(selectedType).map(field => {
      if (field.name === 'clientId') {
        // Filter out any clients without required fields
        const options = clients
          .filter(c => c && c.id && c.name)
          .map(c => ({ value: c.id, label: c.name }));
        console.log('[EmployeeModal] Client options:', options);
        return {
          ...field,
          options
        };
      }
      if (field.name === 'vendorId') {
        // Filter out any vendors without required fields
        const options = vendors
          .filter(v => v && v.id && v.name)
          .map(v => ({ value: v.id, label: v.name }));
        console.log('[EmployeeModal] Vendor options:', options);
        return {
          ...field,
          options
        };
      }
      return field;
    });
  }, [selectedType, clients, vendors]);

  const handleInputChange = (field: FormField, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field.name]: value }));
    // Clear error when user starts typing
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

      // Email validation
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

    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const employeeData = {
        ...formData,
        type: selectedType,
      };

      if (mode === 'create') {
        await createEmployee(employeeData as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>);
      } else if (mode === 'edit' && employee) {
        await updateEmployee(employee.id, employeeData as Partial<Employee>);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const isDisabled = mode === 'view';

    const baseInputClasses = cn(
      'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
      errors[field.name]
        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
      isDisabled
        ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800'
        : 'text-slate-900 dark:text-white'
    );

    switch (field.type) {
      case 'select':
        const isLoadingData = (field.name === 'clientId' && clientsLoading) ||
                             (field.name === 'vendorId' && vendorsLoading);
        const hasNoData = field.options && field.options.length === 0;

        // Debug logging in render
        if (field.name === 'clientId' || field.name === 'vendorId') {
          console.log(`[renderField] Rendering ${field.name}:`, {
            fieldName: field.name,
            optionsCount: field.options?.length || 0,
            isLoadingData,
            hasNoData,
            firstThreeOptions: field.options?.slice(0, 3)
          });
        }

        // Generate unique key to force re-render when options change
        const selectKey = field.name === 'clientId'
          ? `${field.name}-${clients.length}`
          : field.name === 'vendorId'
          ? `${field.name}-${vendors.length}`
          : field.name;

        return (
          <select
            key={selectKey}
            value={String(value ?? '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={isDisabled || isLoadingData}
            className={baseInputClasses}
          >
            <option value="">
              {isLoadingData
                ? `Loading ${field.label.toLowerCase()}...`
                : hasNoData
                ? `No ${field.label.toLowerCase()} available`
                : `Select ${field.label}`}
            </option>
            {field.options?.map((option, index) => (
              <option key={option.value || `option-${index}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field, e.target.checked)}
              disabled={isDisabled}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => handleInputChange(field, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            disabled={isDisabled}
            className={baseInputClasses}
            min="0"
            step={field.name.includes('pay') || field.name.includes('salary') ? '0.01' : '1'}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={String(value ?? '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            className={baseInputClasses}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {mode === 'create' && 'Add New Employee'}
            {mode === 'edit' && 'Edit Employee'}
            {mode === 'view' && 'Employee Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="p-6">
            {/* Employee Type Selector (only for create mode) */}
            {mode === 'create' && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {employeeTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setSelectedType(type.value);
                        setFormData({ type: type.value });
                        setErrors({});
                      }}
                      className={cn(
                        'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                        selectedType === type.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Badge (for edit/view mode) */}
            {mode !== 'create' && employee && (
              <div className="mb-6">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-sm font-medium',
                    employee.type === 'W2' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                    employee.type === 'Contract' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
                    employee.type === '1099' && 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
                    employee.type === 'Offshore' && 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
                  )}
                >
                  {employee.type} Employee
                </span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                // Debug log for client/vendor fields
                if (field.name === 'clientId' || field.name === 'vendorId') {
                  console.log(`[fields.map] Mapping ${field.name}:`, {
                    name: field.name,
                    optionsCount: field.options?.length || 0
                  });
                }

                return (
                  <div
                    key={field.name}
                    className={cn(
                      field.type === 'checkbox' && 'flex items-end'
                    )}
                  >
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Saving...
                  </span>
                ) : mode === 'create' ? (
                  'Add Employee'
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
