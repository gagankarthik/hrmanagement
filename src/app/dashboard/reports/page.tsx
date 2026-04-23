'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3, Download, Users, TrendingUp, MapPin, AlertTriangle,
  FileText, Printer, Filter, X, DollarSign, Globe, Briefcase, Building2, Package,
  CheckCircle2, Clock, ChevronDown,
} from 'lucide-react';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';

// ── helpers ────────────────────────────────────────────────────────────────

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const v = row[h];
      if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) return `"${v.replace(/"/g, '""')}"`;
      return v ?? '';
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printSection(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
      h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
      .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
      tr:hover td { background: #f8fafc; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .badge-green { background: #dcfce7; color: #166534; }
      .badge-red { background: #fee2e2; color: #991b1b; }
      .badge-amber { background: #fef3c7; color: #92400e; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-purple { background: #f3e8ff; color: #7e22ce; }
      .badge-teal { background: #ccfbf1; color: #134e4a; }
      .badge-pink { background: #fce7f3; color: #9d174d; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
      .stat-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
      .stat-value { font-size: 28px; font-weight: 700; color: #0f172a; }
      .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
      .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 20px 0 10px; border-left: 3px solid #6366f1; padding-left: 10px; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
      @media print { body { padding: 16px; } }
    </style>
    </head><body>
    ${htmlContent}
    <div class="footer">Generated on ${format(new Date(), 'MMMM d, yyyy h:mm a')} · ZenHR Workforce Management</div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
    </body></html>
  `);
  printWindow.document.close();
}

// ── color maps ──────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  W2: 'badge-blue', Contract: 'badge-purple', '1099': 'badge-teal', Offshore: 'badge-pink',
};
const STATUS_BADGE: Record<string, string> = {
  Active: 'badge-green', Terminated: 'badge-red',
};

// ── component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { employees, stats, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRevenue, setFilterRevenue] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = [filterType, filterStatus, filterRevenue, filterClient, filterVendor, filterState].some((f) => f !== 'all');

  const clearFilters = () => {
    setFilterType('all'); setFilterStatus('all'); setFilterRevenue('all');
    setFilterClient('all'); setFilterVendor('all'); setFilterState('all');
  };

  // filtered employee set
  const filteredEmployees = useMemo(() => employees.filter((emp) => {
    if (filterType !== 'all' && emp.type !== filterType) return false;
    if (filterStatus !== 'all' && !('status' in emp && emp.status === filterStatus)) return false;
    if (filterRevenue !== 'all' && !('revenueStatus' in emp && emp.revenueStatus === filterRevenue)) return false;
    if (filterState !== 'all' && emp.state !== filterState) return false;
    if (filterClient !== 'all') {
      const ids = emp.clientAssignments?.map((a) => a.clientId) ?? (emp.clientId ? [emp.clientId] : []);
      if (!ids.includes(filterClient)) return false;
    }
    if (filterVendor !== 'all') {
      const ids = emp.vendorAssignments?.map((a) => a.vendorId) ?? (emp.vendorId ? [emp.vendorId] : []);
      if (!ids.includes(filterVendor)) return false;
    }
    return true;
  }), [employees, filterType, filterStatus, filterRevenue, filterClient, filterVendor, filterState]);

  // Derived analytics
  const stateDistribution = useMemo(() => {
    const d: Record<string, number> = {};
    filteredEmployees.forEach((e) => { if (e.state) d[e.state] = (d[e.state] || 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]);
  }, [filteredEmployees]);

  const authDistribution = useMemo(() => {
    const d: Record<string, number> = {};
    filteredEmployees.forEach((e) => {
      if (e.type !== 'Offshore' && 'workAuthorization' in e) {
        const k = e.workAuthorization || 'Not Specified';
        d[k] = (d[k] || 0) + 1;
      }
    });
    return Object.entries(d).sort((a, b) => b[1] - a[1]);
  }, [filteredEmployees]);

  const positionDistribution = useMemo(() => {
    const d: Record<string, number> = {};
    filteredEmployees.forEach((e) => { if (e.position) d[e.position] = (d[e.position] || 0) + 1; });
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredEmployees]);

  const expiringAuth = useMemo(() => {
    const now = new Date();
    const ninety = new Date(); ninety.setDate(ninety.getDate() + 90);
    return filteredEmployees.filter((e) => {
      if (e.type === 'Offshore' || !('expiryDate' in e) || !e.expiryDate) return false;
      const d = new Date(e.expiryDate);
      return d > now && d <= ninety;
    }).sort((a, b) => new Date((a as any).expiryDate).getTime() - new Date((b as any).expiryDate).getTime());
  }, [filteredEmployees]);

  const activeCount = filteredEmployees.filter((e) => 'status' in e && e.status === 'Active').length;
  const billableCount = filteredEmployees.filter((e) => 'revenueStatus' in e && e.revenueStatus === 'B').length;

  const allStates = useMemo(() => [...new Set(employees.map((e) => e.state).filter(Boolean))].sort(), [employees]);
  const allClientOptions = useMemo(() =>
    clients.filter((c) => employees.some((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId) ?? (e.clientId ? [e.clientId] : []);
      return ids.includes(c.id);
    })),
    [clients, employees]);
  const allVendorOptions = useMemo(() =>
    vendors.filter((v) => employees.some((e) => {
      const ids = e.vendorAssignments?.map((a) => a.vendorId) ?? (e.vendorId ? [e.vendorId] : []);
      return ids.includes(v.id);
    })),
    [vendors, employees]);

  // ── Export functions ─────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows = filteredEmployees.map((e) => ({
      Name: e.name, Type: e.type, Position: e.position, State: e.state,
      City: e.city, 'Hire Date': e.hireDate || '',
      'Work Auth': ('workAuthorization' in e ? e.workAuthorization : 'N/A') || '',
      'Expiry Date': ('expiryDate' in e ? e.expiryDate : 'N/A') || '',
      Status: ('status' in e ? e.status : 'N/A') || '',
      Revenue: ('revenueStatus' in e ? e.revenueStatus : 'N/A') || '',
      Email: e.personalEmail || '',
    }));
    downloadCSV(rows as Record<string, unknown>[], 'employee_report');
  };

  const buildEmployeeTableHTML = (emps: Employee[], title: string) => {
    const rows = emps.map((e) => {
      const auth = 'workAuthorization' in e ? e.workAuthorization : '';
      const expiry = 'expiryDate' in e && e.expiryDate ? format(new Date(e.expiryDate), 'MMM d, yyyy') : '';
      const status = 'status' in e ? e.status : '';
      const badgeType = TYPE_BADGE[e.type] || 'badge-blue';
      const badgeStatus = STATUS_BADGE[status] || '';
      return `<tr>
        <td>${e.name || ''}</td>
        <td><span class="badge ${badgeType}">${e.type}</span></td>
        <td>${e.position || ''}</td>
        <td>${e.state || ''}</td>
        <td>${e.hireDate ? format(new Date(e.hireDate), 'MMM d, yyyy') : ''}</td>
        <td>${auth || ''}</td>
        <td>${expiry}</td>
        <td><span class="badge ${badgeStatus}">${status}</span></td>
      </tr>`;
    }).join('');
    return `
      <h1>${title}</h1>
      <p class="subtitle">${emps.length} employee${emps.length !== 1 ? 's' : ''} · ${format(new Date(), 'MMMM d, yyyy')}</p>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${emps.length}</div><div class="stat-label">Total</div></div>
        <div class="stat-card"><div class="stat-value">${emps.filter((e) => 'status' in e && e.status === 'Active').length}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-value">${emps.filter((e) => 'revenueStatus' in e && e.revenueStatus === 'B').length}</div><div class="stat-label">Billable</div></div>
        <div class="stat-card"><div class="stat-value">${[...new Set(emps.map((e) => e.state).filter(Boolean))].length}</div><div class="stat-label">States</div></div>
      </div>
      <table><thead><tr>
        <th>Name</th><th>Type</th><th>Position</th><th>State</th>
        <th>Hire Date</th><th>Work Auth</th><th>Expiry</th><th>Status</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  };

  const exportPDF = () => printSection('Employee Report - ZenHR', buildEmployeeTableHTML(filteredEmployees, 'Employee Report'));

  const exportSingleEmployee = (emp: Employee) => {
    const clientName = (() => {
      const ids = emp.clientAssignments?.map((a) => a.clientId) ?? (emp.clientId ? [emp.clientId] : []);
      return ids.map((id) => clients.find((c) => c.id === id)?.name || id).join(', ') || emp.client || '—';
    })();
    const vendorName = (() => {
      const ids = emp.vendorAssignments?.map((a) => a.vendorId) ?? (emp.vendorId ? [emp.vendorId] : []);
      return ids.map((id) => vendors.find((v) => v.id === id)?.name || id).join(', ') || emp.vendorName || '—';
    })();
    const auth = 'workAuthorization' in emp ? emp.workAuthorization : '';
    const expiry = 'expiryDate' in emp && emp.expiryDate ? format(new Date(emp.expiryDate), 'MMMM d, yyyy') : 'N/A';
    const status = 'status' in emp ? emp.status : '';
    const pay = 'pay' in emp && emp.pay ? `$${emp.pay.toLocaleString()}` : ('salary' in emp && emp.salary ? `₹${emp.salary.toLocaleString()}/mo` : 'N/A');
    printSection(`${emp.name} — Employee Profile`, `
      <h1>${emp.name}</h1>
      <p class="subtitle">${emp.position} · <span class="badge ${TYPE_BADGE[emp.type]}">${emp.type}</span> · <span class="badge ${STATUS_BADGE[status] || ''}">${status}</span></p>
      <div class="section-title">Personal Information</div>
      <table><tbody>
        <tr><td><strong>Date of Birth</strong></td><td>${emp.dob ? format(new Date(emp.dob), 'MMMM d, yyyy') : '—'}</td>
            <td><strong>Contact</strong></td><td>${emp.contactNo || '—'}</td></tr>
        <tr><td><strong>Personal Email</strong></td><td>${emp.personalEmail || '—'}</td>
            <td><strong>Address</strong></td><td>${[emp.address, emp.city, emp.state, emp.pincode].filter(Boolean).join(', ')}</td></tr>
      </tbody></table>
      <div class="section-title">Employment Details</div>
      <table><tbody>
        <tr><td><strong>Hire Date</strong></td><td>${emp.hireDate ? format(new Date(emp.hireDate), 'MMMM d, yyyy') : '—'}</td>
            <td><strong>Pay / Salary</strong></td><td>${pay}</td></tr>
        <tr><td><strong>Client</strong></td><td>${clientName}</td>
            <td><strong>Vendor</strong></td><td>${vendorName}</td></tr>
        <tr><td><strong>Revenue Status</strong></td><td>${'revenueStatus' in emp ? (emp.revenueStatus === 'B' ? 'Billable' : 'Non-Billable') : '—'}</td>
            <td><strong>Sub. Status</strong></td><td>${'subcontractorStatus' in emp ? emp.subcontractorStatus || '—' : '—'}</td></tr>
      </tbody></table>
      ${emp.type !== 'Offshore' && auth ? `
      <div class="section-title">Work Authorization</div>
      <table><tbody>
        <tr><td><strong>Authorization</strong></td><td>${auth}</td>
            <td><strong>Expiry Date</strong></td><td>${expiry}</td></tr>
      </tbody></table>` : ''}
      ${emp.type === 'Offshore' ? `
      <div class="section-title">India Tax Information</div>
      <table><tbody>
        <tr><td><strong>Aadhar Number</strong></td><td>${(emp as any).aadharNumber || '—'}</td>
            <td><strong>PAN Number</strong></td><td>${(emp as any).panNumber || '—'}</td></tr>
        <tr><td><strong>PF Number</strong></td><td>${(emp as any).pfNumber || '—'}</td>
            <td><strong>Payroll Entity</strong></td><td>${(emp as any).payrollEntity || '—'}</td></tr>
      </tbody></table>` : ''}
    `);
  };

  const exportClientReport = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const clientEmps = employees.filter((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId) ?? (e.clientId ? [e.clientId] : []);
      return ids.includes(clientId);
    });
    printSection(`Client Report: ${client.name}`, `
      <h1>Client Report: ${client.name}</h1>
      <p class="subtitle">Generated ${format(new Date(), 'MMMM d, yyyy')}</p>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${clientEmps.length}</div><div class="stat-label">Total Employees</div></div>
        <div class="stat-card"><div class="stat-value">${clientEmps.filter((e) => 'status' in e && e.status === 'Active').length}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-value">${clientEmps.filter((e) => 'revenueStatus' in e && e.revenueStatus === 'B').length}</div><div class="stat-label">Billable</div></div>
        <div class="stat-card"><div class="stat-value">${client.status}</div><div class="stat-label">Client Status</div></div>
      </div>
      <div class="section-title">Client Details</div>
      <table><tbody>
        <tr><td><strong>Contact Person</strong></td><td>${client.contactPerson || '—'}</td>
            <td><strong>Email</strong></td><td>${client.email || '—'}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${client.phone || '—'}</td>
            <td><strong>Address</strong></td><td>${client.address || '—'}</td></tr>
      </tbody></table>
      ${buildEmployeeTableHTML(clientEmps, 'Assigned Employees')}
    `);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">Analytics, insights, and data exports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
              showFilters || hasFilters
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white">
                {[filterType, filterStatus, filterRevenue, filterClient, filterVendor, filterState].filter((f) => f !== 'all').length}
              </span>
            )}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition-all hover:bg-rose-700 hover:shadow-md"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            {[
              { label: 'Employee Type', key: 'type', value: filterType, set: setFilterType, options: [
                { value: 'all', label: 'All Types' }, { value: 'W2', label: 'W2' }, { value: 'Contract', label: 'Contract' },
                { value: '1099', label: '1099' }, { value: 'Offshore', label: 'Offshore' },
              ]},
              { label: 'Status', key: 'status', value: filterStatus, set: setFilterStatus, options: [
                { value: 'all', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Terminated', label: 'Terminated' },
              ]},
              { label: 'Revenue', key: 'revenue', value: filterRevenue, set: setFilterRevenue, options: [
                { value: 'all', label: 'All' }, { value: 'B', label: 'Billable' }, { value: 'NB', label: 'Non-Billable' },
              ]},
              { label: 'State', key: 'state', value: filterState, set: setFilterState, options: [
                { value: 'all', label: 'All States' }, ...allStates.map((s) => ({ value: s, label: s })),
              ]},
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{f.label}</label>
                <select
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                >
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              >
                <option value="all">All Clients</option>
                {allClientOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vendor</label>
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              >
                <option value="all">All Vendors</option>
                {allVendorOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                <X className="h-4 w-4" /> Clear All
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="mt-3 text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> of {employees.length} employees
            </p>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Employees', value: filteredEmployees.length, icon: Users, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { label: 'Billable', value: billableCount, icon: DollarSign, bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
          { label: 'Expiring (90d)', value: expiringAuth.length, icon: AlertTriangle, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', s.iconBg)}>
              <s.icon className={cn('h-5 w-5', s.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employee Types */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-slate-900">Employee Types</h3>
          <div className="space-y-4">
            {[
              { label: 'W2', count: filteredEmployees.filter((e) => e.type === 'W2').length, color: 'bg-blue-500', light: 'text-blue-700 bg-blue-50' },
              { label: 'Contract', count: filteredEmployees.filter((e) => e.type === 'Contract').length, color: 'bg-purple-500', light: 'text-purple-700 bg-purple-50' },
              { label: '1099', count: filteredEmployees.filter((e) => e.type === '1099').length, color: 'bg-teal-500', light: 'text-teal-700 bg-teal-50' },
              { label: 'Offshore', count: filteredEmployees.filter((e) => e.type === 'Offshore').length, color: 'bg-pink-500', light: 'text-pink-700 bg-pink-50' },
            ].map((item) => {
              const pct = filteredEmployees.length > 0 ? (item.count / filteredEmployees.length) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', item.light)}>{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.count} <span className="text-xs text-slate-400">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full transition-all duration-700', item.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top States */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-slate-900">Geographic Distribution</h3>
          {stateDistribution.length === 0 ? (
            <p className="text-sm text-slate-400">No state data available</p>
          ) : (
            <div className="space-y-3">
              {stateDistribution.slice(0, 8).map(([state, count], idx) => {
                const maxCount = stateDistribution[0]?.[1] || 1;
                return (
                  <div key={state} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-slate-400">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{state}</span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Work Auth */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-slate-900">Work Authorization Types</h3>
          {authDistribution.length === 0 ? (
            <p className="text-sm text-slate-400">No work authorization data</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {authDistribution.slice(0, 8).map(([auth, count], idx) => {
                const colors = ['bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-200', 'bg-purple-50 border-purple-200', 'bg-orange-50 border-orange-200', 'bg-pink-50 border-pink-200', 'bg-teal-50 border-teal-200', 'bg-indigo-50 border-indigo-200', 'bg-rose-50 border-rose-200'];
                const textColors = ['text-blue-700', 'text-emerald-700', 'text-purple-700', 'text-orange-700', 'text-pink-700', 'text-teal-700', 'text-indigo-700', 'text-rose-700'];
                return (
                  <div key={auth} className={cn('rounded-xl border p-3', colors[idx % colors.length])}>
                    <p className={cn('text-xl font-bold', textColors[idx % textColors.length])}>{count}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">{auth}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Positions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-slate-900">Top Job Titles</h3>
          {positionDistribution.length === 0 ? (
            <p className="text-sm text-slate-400">No position data available</p>
          ) : (
            <div className="space-y-2">
              {positionDistribution.map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                  <span className="truncate text-sm text-slate-700 max-w-[220px]">{pos}</span>
                  <span className="ml-2 flex-shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiring Authorizations */}
      {expiringAuth.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-900">Work Authorizations Expiring (90 days)</h3>
                <p className="text-xs text-amber-600">{expiringAuth.length} employee{expiringAuth.length !== 1 ? 's' : ''} require attention</p>
              </div>
            </div>
            <button
              onClick={() => {
                const rows = expiringAuth.map((e) => ({
                  Name: e.name, Type: e.type, 'Work Auth': ('workAuthorization' in e ? e.workAuthorization : '') || '',
                  'Expiry Date': ('expiryDate' in e ? e.expiryDate : '') || '',
                  'Days Left': Math.ceil((new Date(('expiryDate' in e ? e.expiryDate : '') || '').getTime() - Date.now()) / 86400000).toString(),
                }));
                downloadCSV(rows as Record<string, unknown>[], 'expiring_authorizations');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200">
                  {['Name', 'Type', 'Work Authorization', 'Expiry Date', 'Days Left', ''].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-amber-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {expiringAuth.map((emp) => {
                  if (!('expiryDate' in emp) || !emp.expiryDate) return null;
                  const days = Math.ceil((new Date(emp.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={emp.id}>
                      <td className="py-2.5 pr-4 font-medium text-amber-900">{emp.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', TYPE_BADGE[emp.type] && 'bg-blue-100 text-blue-700')}>{emp.type}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-amber-800">{'workAuthorization' in emp ? emp.workAuthorization : ''}</td>
                      <td className="py-2.5 pr-4 text-amber-800">{format(new Date(emp.expiryDate), 'MMM d, yyyy')}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', days <= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                          {days}d
                        </span>
                      </td>
                      <td>
                        <button onClick={() => exportSingleEmployee(emp)} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-200" title="Export PDF">
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Reports */}
      {allClientOptions.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Client Reports</h3>
              <p className="text-xs text-slate-500">Generate PDF report for each client</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allClientOptions.map((client) => {
              const count = employees.filter((e) => {
                const ids = e.clientAssignments?.map((a) => a.clientId) ?? (e.clientId ? [e.clientId] : []);
                return ids.includes(client.id);
              }).length;
              return (
                <div key={client.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">{count} employee{count !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => exportClientReport(client.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                  >
                    <Printer className="h-3.5 w-3.5 text-blue-600" /> PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee List with per-row export */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Employee Directory</h3>
            <p className="text-xs text-slate-500">{filteredEmployees.length} records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5 text-emerald-600" /> CSV
            </button>
            <button onClick={exportPDF} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
              <Printer className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Employee', 'Type', 'Position', 'State', 'Work Auth', 'Status', 'Revenue', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.slice(0, 50).map((emp) => {
                const auth = 'workAuthorization' in emp ? emp.workAuthorization : '';
                const status = 'status' in emp ? emp.status : '';
                const revenue = 'revenueStatus' in emp ? emp.revenueStatus : '';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                          {emp.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.personalEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', {
                        'bg-blue-100 text-blue-700': emp.type === 'W2',
                        'bg-purple-100 text-purple-700': emp.type === 'Contract',
                        'bg-teal-100 text-teal-700': emp.type === '1099',
                        'bg-pink-100 text-pink-700': emp.type === 'Offshore',
                      })}>
                        {emp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{emp.position || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.state || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{auth || (emp.type === 'Offshore' ? 'N/A' : '—')}</td>
                    <td className="px-4 py-3">
                      {status && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                          {status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {revenue && (
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', revenue === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}>
                          {revenue === 'B' ? 'Billable' : 'NB'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => exportSingleEmployee(emp)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Export PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEmployees.length > 50 && (
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Showing 50 of {filteredEmployees.length} employees. Export to CSV/PDF for full list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
