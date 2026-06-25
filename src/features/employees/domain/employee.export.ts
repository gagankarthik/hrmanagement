import type { Employee } from '@/types/employee';

/**
 * Download the given employees as CSV or JSON. Browser-only (uses Blob + a
 * temporary anchor). Extracted verbatim from EmployeeContext.exportData.
 */
export function exportEmployees(dataToExport: Employee[], format: 'csv' | 'json'): void {
  if (dataToExport.length === 0) {
    alert('No data to export');
    return;
  }

  const stamp = new Date().toISOString().split('T')[0];

  const download = (content: string, mime: string, ext: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${stamp}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (format === 'json') {
    download(JSON.stringify(dataToExport, null, 2), 'application/json', 'json');
    return;
  }

  const headers = Object.keys(dataToExport[0] || {}).join(',');
  const rows = dataToExport.map((emp) =>
    Object.values(emp)
      .map((val) => (typeof val === 'string' && val.includes(',') ? `"${val}"` : val))
      .join(','),
  );
  download([headers, ...rows].join('\n'), 'text/csv', 'csv');
}
