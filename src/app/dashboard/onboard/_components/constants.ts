// Static configuration for the onboarding wizard: the selectable employee-type
// cards and the step labels. Extracted verbatim from the original page.tsx.

import type React from 'react';
import { Briefcase, FileText, Globe } from 'lucide-react';
import type { EmployeeType } from '@/types/employee';

export const employeeTypes: {
  value: EmployeeType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  ring: string;
  selectedBorder: string;
}[] = [
  {
    value: 'W2',
    label: 'W2 Employee',
    description: 'Full-time employees with benefits and standard payroll',
    icon: Briefcase,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ring: 'hover:border-blue-300',
    selectedBorder: 'border-blue-500 ring-2 ring-blue-200',
  },
  {
    value: 'Contract',
    label: 'Contract',
    description: 'Temporary contract workers on a project basis',
    icon: FileText,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    ring: 'hover:border-purple-300',
    selectedBorder: 'border-purple-500 ring-2 ring-purple-200',
  },
  {
    value: '1099',
    label: '1099',
    description: 'Independent contractors filing 1099 forms',
    icon: FileText,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    ring: 'hover:border-teal-300',
    selectedBorder: 'border-teal-500 ring-2 ring-teal-200',
  },
  {
    value: 'Offshore',
    label: 'Offshore',
    description: 'International remote employees working offshore',
    icon: Globe,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    ring: 'hover:border-pink-300',
    selectedBorder: 'border-pink-500 ring-2 ring-pink-200',
  },
];

export const WIZARD_STEPS = [
  { label: 'Select type', description: 'Employee category' },
  { label: 'Details', description: 'Fill in the fields' },
  { label: 'Review', description: 'Confirm and add' },
];

export type WizardStep = 0 | 1 | 2;
