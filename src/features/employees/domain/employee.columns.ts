import type { EmployeeType } from './employee.types';

/**
 * Per-type table column configuration for the workforce list.
 *
 * These powered the original per-type pages (W2 / Contract / 1099 / Offshore).
 * When those pages merged into one, the table collapsed to a generic column
 * set and this knowledge went unused; the per-type tabs on /employees now
 * consume it again so each type shows the columns that matter for it.
 */

// Column configurations for tables
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

export const W2_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'officeEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'pay', label: 'Pay', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const CONTRACT_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'personalEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'contractorName', label: 'Contractor', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const EMPLOYEE_1099_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'personalEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'pay', label: 'Pay', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const OFFSHORE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'officeEmail', label: 'Email', sortable: false },
  { key: 'salary', label: 'Salary', sortable: true },
  { key: 'employmentType', label: 'Type', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

/** Columns for the combined "All types" view. */
export const ALL_TYPES_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'state', label: 'Location', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export function getColumnsByType(type: EmployeeType): TableColumn[] {
  switch (type) {
    case 'W2': return W2_COLUMNS;
    case 'Contract': return CONTRACT_COLUMNS;
    case '1099': return EMPLOYEE_1099_COLUMNS;
    case 'Offshore': return OFFSHORE_COLUMNS;
  }
}
