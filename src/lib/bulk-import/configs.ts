// Entity import configs. The four partner entities share one column set; the
// four employee types are derived from the same FormField arrays the manual
// onboarding form uses, so the importer stays in sync with the form.

import { EmployeeType, FormField, getFieldsByType } from '@/types/employee';
import { ImportColumn, ImportEntityConfig } from './types';

// ── Partner entities (clients / vendors / subcontractors / end clients) ──────
// Identical 5-field shape; only the endpoint and label differ.
function partnerColumns(): ImportColumn[] {
  return [
    { field: 'name', header: 'Name', type: 'text', required: true, example: 'Acme Corporation' },
    { field: 'contactPerson', header: 'Contact Person', type: 'text', aliases: ['contact', 'poc'], example: 'Jane Doe' },
    { field: 'email', header: 'Email', type: 'email', example: 'jane@acme.com' },
    { field: 'phone', header: 'Phone', type: 'tel', aliases: ['phone number', 'contact number'], example: '+1 (555) 000-0000' },
    { field: 'address', header: 'Address', type: 'text', example: '500 Market St, San Francisco, CA' },
    {
      field: 'status',
      header: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      example: 'Active',
    },
  ];
}

function partnerConfig(key: string, label: string, apiPath: string): ImportEntityConfig {
  return { key, label, apiPath, columns: partnerColumns() };
}

export const CLIENT_IMPORT = partnerConfig('clients', 'Clients', '/api/clients/bulk');
export const VENDOR_IMPORT = partnerConfig('vendors', 'Vendors', '/api/vendors/bulk');
export const SUBCONTRACTOR_IMPORT = partnerConfig('subcontractors', 'Subcontractors', '/api/subcontractors/bulk');
export const ENDCLIENT_IMPORT = partnerConfig('endclients', 'End Clients', '/api/endclients/bulk');

// ── Employees ────────────────────────────────────────────────────────────────
// Convert a manual-form FormField into an import column. Client/Vendor selects
// (which use ids in the form) become name-resolved lookups for import.
function fieldToColumn(f: FormField): ImportColumn {
  if (f.name === 'clientId') {
    return { field: 'clientId', header: 'Client', type: 'lookup', lookup: 'clients', example: 'Acme Corporation' };
  }
  if (f.name === 'vendorId') {
    return { field: 'vendorId', header: 'Vendor', type: 'lookup', lookup: 'vendors', example: 'Acme Staffing Inc.' };
  }

  const base: ImportColumn = {
    field: f.name,
    header: f.label,
    type: 'text',
    // A nameless employee record is meaningless on import, so require it even
    // though the manual form leaves every field optional.
    required: f.name === 'name',
  };

  switch (f.type) {
    case 'checkbox':
      return { ...base, type: 'boolean', example: 'No' };
    case 'number':
      return { ...base, type: 'number' };
    case 'date':
      return { ...base, type: 'date', example: '2026-01-15' };
    case 'email':
      return { ...base, type: 'email' };
    case 'tel':
      return { ...base, type: 'tel' };
    case 'select': {
      const options = (f.options ?? []).map((o) => o.value);
      const optionLabels = Object.fromEntries((f.options ?? []).map((o) => [o.value, o.label]));
      return { ...base, type: 'select', options, optionLabels, example: options[0] };
    }
    default:
      return base;
  }
}

function employeeConfig(type: EmployeeType): ImportEntityConfig {
  return {
    key: `employee-${type.toLowerCase()}`,
    label: type,
    apiPath: '/api/employees/bulk',
    fixed: { type },
    columns: getFieldsByType(type).map(fieldToColumn),
  };
}

export const EMPLOYEE_IMPORTS: ImportEntityConfig[] = (
  ['W2', 'Contract', '1099', 'Offshore'] as EmployeeType[]
).map(employeeConfig);

export const PARTNER_IMPORTS = {
  clients: CLIENT_IMPORT,
  vendors: VENDOR_IMPORT,
  subcontractors: SUBCONTRACTOR_IMPORT,
  endclients: ENDCLIENT_IMPORT,
} as const;
