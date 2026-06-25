import type { Employee, EmployeeFilters, DashboardStats } from '@/types/employee';

/**
 * Pure employee business rules — no React, no I/O. Extracted verbatim from
 * EmployeeContext so the same logic is unit-testable and reusable.
 */

/** Apply the dashboard filter set (type / status / state / search) to a list. */
export function filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
  return employees.filter((employee) => {
    if (filters.type !== 'All' && employee.type !== filters.type) {
      return false;
    }
    if (filters.status !== 'All') {
      if ('status' in employee && employee.status !== filters.status) {
        return false;
      }
    }
    if (filters.state && employee.state.toLowerCase() !== filters.state.toLowerCase()) {
      return false;
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableFields = [
        employee.name,
        employee.position,
        employee.personalEmail,
        'officeEmail' in employee ? employee.officeEmail : '',
        'client' in employee ? employee.client : '',
        employee.vendorName,
      ];
      return searchableFields.some((field) => field?.toLowerCase().includes(query));
    }
    return true;
  });
}

/** Derive all dashboard KPIs / trends from the full employee list. */
export function computeDashboardStats(employees: Employee[]): DashboardStats {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringCount = employees.filter((emp) => {
    // Exclude Offshore employees from expiry tracking
    if (emp.type === 'Offshore') return false;
    if (!('expiryDate' in emp) || !emp.expiryDate) return false;
    const expiry = new Date(emp.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  }).length;

  const billableCount = employees.filter((e) => 'revenueStatus' in e && e.revenueStatus === 'B').length;
  const nonBillableCount = employees.filter((e) => 'revenueStatus' in e && e.revenueStatus === 'NB').length;

  const activeSubcontractors = employees.filter((e) => 'subcontractorStatus' in e && e.subcontractorStatus === 'Active').length;
  const inactiveSubcontractors = employees.filter((e) => 'subcontractorStatus' in e && e.subcontractorStatus === 'Inactive').length;

  const clientSet = new Set<string>();
  const vendorSet = new Set<string>();
  employees.forEach((emp) => {
    if (emp.clientAssignments?.length) {
      emp.clientAssignments.forEach((a) => { if (a.clientId) clientSet.add(a.clientId); });
    } else if (emp.clientId) {
      clientSet.add(emp.clientId);
    } else if (emp.client) {
      clientSet.add(emp.client);
    }
    if (emp.vendorAssignments?.length) {
      emp.vendorAssignments.forEach((a) => { if (a.vendorId) vendorSet.add(a.vendorId); });
    } else if (emp.vendorId) {
      vendorSet.add(emp.vendorId);
    } else if (emp.vendorName) {
      vendorSet.add(emp.vendorName);
    }
  });

  const hiringTrendByMonth: { month: string; count: number; w2: number; offshore: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const monthStr = `${month} ${year}`;

    const monthEmployees = employees.filter((emp) => {
      if (!emp.hireDate) return false;
      const hireDate = new Date(emp.hireDate);
      return hireDate.getMonth() === date.getMonth() && hireDate.getFullYear() === date.getFullYear();
    });

    hiringTrendByMonth.push({
      month: monthStr,
      count: monthEmployees.length,
      w2: monthEmployees.filter((e) => e.type === 'W2').length,
      offshore: monthEmployees.filter((e) => e.type === 'Offshore').length,
    });
  }

  return {
    totalEmployees: employees.length,
    w2Count: employees.filter((e) => e.type === 'W2').length,
    contractCount: employees.filter((e) => e.type === 'Contract').length,
    employee1099Count: employees.filter((e) => e.type === '1099').length,
    offshoreCount: employees.filter((e) => e.type === 'Offshore').length,
    activeCount: employees.filter((e) => 'status' in e && e.status === 'Active').length,
    terminatedCount: employees.filter((e) => 'status' in e && e.status === 'Terminated').length,
    expiringAuthorizations: expiringCount,
    billableCount,
    nonBillableCount,
    activeSubcontractors,
    inactiveSubcontractors,
    uniqueClients: clientSet.size,
    uniqueVendors: vendorSet.size,
    hiringTrendByMonth,
  };
}
