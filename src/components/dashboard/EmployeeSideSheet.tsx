'use client';

import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Briefcase, Building2, CreditCard, Shield, Clock, FileText } from 'lucide-react';
import { Employee } from '@/types/employee';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EmployeeSideSheetProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeColors = {
  W2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  '1099': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Offshore: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

const statusColors = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface FieldGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FieldGroup({ title, icon, children }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        {icon}
        {title}
      </div>
      <div className="space-y-2 pl-6">
        {children}
      </div>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  value: string | number | boolean | undefined | null;
  type?: 'text' | 'date' | 'currency' | 'boolean' | 'email' | 'phone';
}

function FieldRow({ label, value, type = 'text' }: FieldRowProps) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let displayValue: React.ReactNode = value;

  if (type === 'date' && typeof value === 'string') {
    try {
      displayValue = format(new Date(value), 'MM/dd/yyyy');
    } catch {
      displayValue = value;
    }
  } else if (type === 'currency' && typeof value === 'number') {
    displayValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  } else if (type === 'boolean') {
    displayValue = value ? (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        No
      </span>
    );
  } else if (type === 'email') {
    displayValue = (
      <a href={`mailto:${value}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
        {value}
      </a>
    );
  } else if (type === 'phone') {
    displayValue = (
      <a href={`tel:${value}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
        {value}
      </a>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-900 dark:text-white">{displayValue}</span>
    </div>
  );
}

export default function EmployeeSideSheet({ employee, isOpen, onClose }: EmployeeSideSheetProps) {
  const { clients } = useClients();
  const { vendors } = useVendors();

  if (!employee) return null;

  // Resolve client and vendor names
  const clientName = employee.clientId
    ? clients.find(c => c.id === employee.clientId)?.name
    : employee.client;
  const vendorName = employee.vendorId
    ? vendors.find(v => v.id === employee.vendorId)?.name
    : employee.vendorName;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Side Sheet */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-hidden bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {employee.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{employee.position}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', typeColors[employee.type])}>
              {employee.type}
            </span>
            {'status' in employee && (
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusColors[employee.status])}>
                {employee.status}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-140px)] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Contact Information */}
            <FieldGroup title="Contact Information" icon={<Mail className="h-4 w-4 text-indigo-500" />}>
              <FieldRow label="Personal Email" value={employee.personalEmail} type="email" />
              {'officeEmail' in employee && (
                <FieldRow label="Office Email" value={employee.officeEmail} type="email" />
              )}
              <FieldRow label="Phone" value={employee.contactNo} type="phone" />
              {'vonageNo' in employee && (
                <FieldRow label="Vonage Number" value={employee.vonageNo} type="phone" />
              )}
            </FieldGroup>

            {/* Location */}
            <FieldGroup title="Location" icon={<MapPin className="h-4 w-4 text-indigo-500" />}>
              <FieldRow label="Address" value={employee.address} />
              <FieldRow label="City" value={employee.city} />
              <FieldRow label="State" value={employee.state} />
              <FieldRow label="Pincode" value={employee.pincode} />
            </FieldGroup>

            {/* Employment Details */}
            <FieldGroup title="Employment Details" icon={<Briefcase className="h-4 w-4 text-indigo-500" />}>
              <FieldRow label="Date of Birth" value={employee.dob} type="date" />
              <FieldRow label="Hire Date" value={employee.hireDate} type="date" />
              {'rehireDate' in employee && employee.rehireDate && (
                <FieldRow label="Rehire Date" value={employee.rehireDate} type="date" />
              )}
              {employee.dor && <FieldRow label="Date of Release" value={employee.dor} type="date" />}
              {'employmentType' in employee && (
                <FieldRow label="Employment Type" value={employee.employmentType} />
              )}
            </FieldGroup>

            {/* Work Authorization - Hide expiry for Offshore */}
            {employee.type !== 'Offshore' && (
              <FieldGroup title="Work Authorization" icon={<Shield className="h-4 w-4 text-indigo-500" />}>
                <FieldRow label="Authorization Type" value={employee.workAuthorization} />
                {'expiryDate' in employee && employee.expiryDate && (
                  <FieldRow label="Expiry Date" value={employee.expiryDate} type="date" />
                )}
              </FieldGroup>
            )}

            {/* Client & Vendor */}
            <FieldGroup title="Client & Vendor" icon={<Building2 className="h-4 w-4 text-indigo-500" />}>
              <FieldRow label="Client" value={clientName} />
              <FieldRow label="Vendor" value={vendorName} />
              {'endClient' in employee && <FieldRow label="End Client" value={employee.endClient} />}
              {'contractorName' in employee && (
                <FieldRow label="Contractor Name" value={employee.contractorName} />
              )}
              {'revenueStatus' in employee && (
                <FieldRow label="Revenue Status" value={employee.revenueStatus === 'B' ? 'Billable' : 'Non-Billable'} />
              )}
              {'subcontractorStatus' in employee && employee.subcontractorStatus && (
                <FieldRow label="Subcontractor Status" value={employee.subcontractorStatus} />
              )}
            </FieldGroup>

            {/* PAN/PF Numbers - Offshore only */}
            {employee.type === 'Offshore' && 'panNumber' in employee && (
              <FieldGroup title="Tax & Provident Fund" icon={<FileText className="h-4 w-4 text-indigo-500" />}>
                <FieldRow label="PAN Number" value={employee.panNumber} />
                {'pfNumber' in employee && employee.pfNumber && (
                  <FieldRow label="PF Number" value={employee.pfNumber} />
                )}
              </FieldGroup>
            )}

            {/* Compensation */}
            {('pay' in employee || 'salary' in employee) && (
              <FieldGroup title="Compensation" icon={<CreditCard className="h-4 w-4 text-indigo-500" />}>
                {'salaryType' in employee && <FieldRow label="Salary Type" value={employee.salaryType} />}
                {'pay' in employee && <FieldRow label="Pay" value={employee.pay} type="currency" />}
                {'salary' in employee && <FieldRow label="Monthly Salary" value={employee.salary} type="currency" />}
                {'medicalReimbursement' in employee && employee.medicalReimbursement && employee.medicalReimbursement > 0 && (
                  <FieldRow label="Medical Reimbursement" value={employee.medicalReimbursement} type="currency" />
                )}
                {'payrollEntity' in employee && (
                  <FieldRow label="Payroll Entity" value={employee.payrollEntity} />
                )}
              </FieldGroup>
            )}

            {/* Benefits (W2 only) */}
            {employee.type === 'W2' && (
              <FieldGroup title="Benefits" icon={<Clock className="h-4 w-4 text-indigo-500" />}>
                <FieldRow label="Medical Benefit" value={employee.medicalBenefit} type="boolean" />
                <FieldRow label="401k Benefit" value={employee.benefit401k} type="boolean" />
              </FieldGroup>
            )}

            {/* Timestamps */}
            <FieldGroup title="Record Info" icon={<Calendar className="h-4 w-4 text-indigo-500" />}>
              <FieldRow label="Created" value={employee.createdAt} type="date" />
              <FieldRow label="Last Updated" value={employee.updatedAt} type="date" />
            </FieldGroup>
          </div>
        </div>
      </div>
    </>
  );
}
