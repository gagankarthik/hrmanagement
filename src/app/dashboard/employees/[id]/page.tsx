'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Package,
  FileText,
  Shield,
  Globe,
  CreditCard,
  Clock,
  Trash2,
  XCircle,
  Cake,
  Award,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

function InfoRow({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: React.ReactNode; className?: string }) {
  if (!value) return null;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

const typeColors: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const router = useRouter();
  const { employees, deleteEmployee, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const [employeeId, setEmployeeId] = React.useState<string>('');

  React.useEffect(() => {
    params.then((p) => setEmployeeId(p.id));
  }, [params]);

  const employee = useMemo(() => {
    if (!employeeId) return undefined;
    return employees.find((e) => e.id === employeeId);
  }, [employees, employeeId]);

  const clientAssignmentNames = useMemo(() => {
    if (!employee) return [];
    if (employee.clientAssignments?.length) {
      return employee.clientAssignments.map((a) => ({
        ...a,
        name: clients.find((c) => c.id === a.clientId)?.name || a.clientId,
      }));
    }
    if (employee.clientId) {
      const name = clients.find((c) => c.id === employee.clientId)?.name || employee.client || employee.clientId;
      return [{ clientId: employee.clientId, name, startDate: undefined, endDate: undefined }];
    }
    if (employee.client) {
      return [{ clientId: '', name: employee.client, startDate: undefined, endDate: undefined }];
    }
    return [];
  }, [employee, clients]);

  const vendorAssignmentNames = useMemo(() => {
    if (!employee) return [];
    if (employee.vendorAssignments?.length) {
      return employee.vendorAssignments.map((a) => ({
        ...a,
        name: vendors.find((v) => v.id === a.vendorId)?.name || a.vendorId,
      }));
    }
    if (employee.vendorId) {
      const name = vendors.find((v) => v.id === employee.vendorId)?.name || employee.vendorName || employee.vendorId;
      return [{ vendorId: employee.vendorId, name, startDate: undefined, endDate: undefined }];
    }
    if (employee.vendorName) {
      return [{ vendorId: '', name: employee.vendorName, startDate: undefined, endDate: undefined }];
    }
    return [];
  }, [employee, vendors]);

  const age = useMemo(() => {
    if (!employee?.dob) return null;
    const today = new Date();
    const birth = new Date(employee.dob);
    let a = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) a--;
    return a;
  }, [employee]);

  const yearsOfService = useMemo(() => {
    if (!employee?.hireDate) return null;
    const today = new Date();
    const hire = new Date(employee.hireDate);
    let y = today.getFullYear() - hire.getFullYear();
    if (today.getMonth() < hire.getMonth() || (today.getMonth() === hire.getMonth() && today.getDate() < hire.getDate())) y--;
    return y;
  }, [employee]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this employee? This cannot be undone.')) {
      await deleteEmployee(employeeId);
      router.push('/dashboard/employees');
    }
  };

  const handlePrint = () => {
    if (!employee) return;
    const clientsText = clientAssignmentNames.length
      ? clientAssignmentNames.map((a) => `${a.name}${a.startDate ? ` (${a.startDate}${a.endDate ? ` → ${a.endDate}` : ' → Present'})` : ''}`).join(', ')
      : 'N/A';
    const vendorsText = vendorAssignmentNames.length
      ? vendorAssignmentNames.map((a) => `${a.name}${a.startDate ? ` (${a.startDate}${a.endDate ? ` → ${a.endDate}` : ' → Present'})` : ''}`).join(', ')
      : 'N/A';

    const workAuthSection = employee.type !== 'Offshore' && 'workAuthorization' in employee ? `
      <div class="section">
        <div class="section-title">Work Authorization</div>
        <table class="info-table">
          <tr><td class="label">Type</td><td>${(employee as { workAuthorization?: string }).workAuthorization || '—'}</td></tr>
          ${'expiryDate' in employee && (employee as { expiryDate?: string }).expiryDate ? `<tr><td class="label">Expiry Date</td><td>${format(new Date((employee as { expiryDate: string }).expiryDate), 'MMMM d, yyyy')}</td></tr>` : ''}
        </table>
      </div>` : '';

    const indiaTaxSection = employee.type === 'Offshore' && 'panNumber' in employee ? `
      <div class="section">
        <div class="section-title">India Tax &amp; Provident Fund</div>
        <table class="info-table">
          ${'aadharNumber' in employee ? `<tr><td class="label">Aadhar Number</td><td>${(employee as { aadharNumber?: string }).aadharNumber || '—'}</td></tr>` : ''}
          <tr><td class="label">PAN Number</td><td>${(employee as { panNumber?: string }).panNumber || '—'}</td></tr>
          ${'pfNumber' in employee && (employee as { pfNumber?: string }).pfNumber ? `<tr><td class="label">PF Number</td><td>${(employee as { pfNumber?: string }).pfNumber}</td></tr>` : ''}
        </table>
      </div>` : '';

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${employee.name} — Employee Profile</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 13px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #6366f1; margin-bottom: 24px; }
      .header-left h1 { font-size: 24px; font-weight: 700; color: #4f46e5; }
      .header-left p { color: #64748b; margin-top: 4px; }
      .header-right { text-align: right; color: #64748b; font-size: 12px; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .badge-active { background: #d1fae5; color: #065f46; }
      .badge-terminated { background: #fee2e2; color: #991b1b; }
      .badge-type { background: #e0e7ff; color: #3730a3; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
      .info-table { width: 100%; border-collapse: collapse; }
      .info-table td { padding: 6px 0; vertical-align: top; }
      .info-table td.label { width: 180px; color: #64748b; font-weight: 500; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div class="header-left">
        <h1>${employee.name}</h1>
        <p>${employee.position || '—'}</p>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <span class="badge badge-type">${employee.type}</span>
          ${'status' in employee ? `<span class="badge ${(employee as { status: string }).status === 'Active' ? 'badge-active' : 'badge-terminated'}">${(employee as { status: string }).status}</span>` : ''}
        </div>
      </div>
      <div class="header-right">
        <strong>Employee Profile</strong><br/>
        Generated: ${format(new Date(), 'MMMM d, yyyy')}<br/>
        ID: ${employee.id.slice(0, 8)}…
      </div>
    </div>
    <div class="two-col">
      <div class="section">
        <div class="section-title">Personal Information</div>
        <table class="info-table">
          <tr><td class="label">Email</td><td>${employee.personalEmail || '—'}</td></tr>
          <tr><td class="label">Phone</td><td>${employee.contactNo || '—'}</td></tr>
          <tr><td class="label">Date of Birth</td><td>${employee.dob ? format(new Date(employee.dob), 'MMMM d, yyyy') : '—'}</td></tr>
          <tr><td class="label">Address</td><td>${[employee.address, employee.city, employee.state, employee.pincode].filter(Boolean).join(', ') || '—'}</td></tr>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Employment Information</div>
        <table class="info-table">
          <tr><td class="label">Employee Type</td><td>${employee.type}</td></tr>
          <tr><td class="label">Hire Date</td><td>${employee.hireDate ? format(new Date(employee.hireDate), 'MMMM d, yyyy') : '—'}</td></tr>
          ${'status' in employee ? `<tr><td class="label">Status</td><td>${(employee as { status: string }).status}</td></tr>` : ''}
          ${'revenueStatus' in employee ? `<tr><td class="label">Revenue Status</td><td>${(employee as { revenueStatus: string }).revenueStatus === 'B' ? 'Billable' : 'Non-Billable'}</td></tr>` : ''}
          ${'pay' in employee && (employee as { pay?: number }).pay ? `<tr><td class="label">Pay</td><td>$${(employee as { pay: number }).pay.toLocaleString()}</td></tr>` : ''}
          <tr><td class="label">Client(s)</td><td>${clientsText}</td></tr>
          <tr><td class="label">Vendor(s)</td><td>${vendorsText}</td></tr>
        </table>
      </div>
    </div>
    ${workAuthSection}
    ${indiaTaxSection}
    <div class="footer">
      <span>ZenHR Workforce Management</span>
      <span>Confidential — Internal Use Only</span>
    </div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
    </body></html>`);
    win.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Employee Not Found</h2>
        <button onClick={() => router.push('/dashboard/employees')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Back to Employees
        </button>
      </div>
    );
  }

  const status = 'status' in employee ? (employee as { status: string }).status : null;
  const workAuth = 'workAuthorization' in employee ? (employee as { workAuthorization?: string; expiryDate?: string }) : null;
  const pay = 'pay' in employee ? (employee as { pay?: number; salaryType?: string }) : null;
  const revenueStatus = 'revenueStatus' in employee ? (employee as { revenueStatus?: string }).revenueStatus : null;
  const offshore = employee.type === 'Offshore' && 'panNumber' in employee
    ? (employee as { panNumber?: string; aadharNumber?: string; pfNumber?: string })
    : null;

  const isAuthExpired = workAuth?.expiryDate && new Date(workAuth.expiryDate) < new Date();
  const isAuthExpiringSoon = workAuth?.expiryDate && !isAuthExpired && new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000);

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur-sm">
            {employee.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{employee.name}</h1>
            <p className="mt-0.5 text-white/80 truncate">{employee.position}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white/20 text-white')}>
                <Briefcase className="h-3 w-3" />{employee.type}
              </span>
              {status && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                  status === 'Active' ? 'bg-emerald-400/30 text-white' : 'bg-red-400/30 text-white'
                )}>
                  {status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {status}
                </span>
              )}
              {revenueStatus && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                  {revenueStatus === 'B' ? 'Billable' : 'Non-Billable'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {(age !== null || yearsOfService !== null) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {age !== null && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                <Cake className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Age</p>
                <p className="text-xl font-bold text-slate-900">{age}</p>
              </div>
            </div>
          )}
          {yearsOfService !== null && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Years</p>
                <p className="text-xl font-bold text-slate-900">{yearsOfService}</p>
              </div>
            </div>
          )}
          {employee.hireDate && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Hire Date</p>
                <p className="text-sm font-bold text-slate-900">{format(new Date(employee.hireDate), 'MMM d, yyyy')}</p>
              </div>
            </div>
          )}
          {pay?.pay && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{pay.salaryType === 'Hourly' ? '/hr' : '/yr'}</p>
                <p className="text-sm font-bold text-slate-900">${pay.pay.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={employee.personalEmail} />
            <InfoRow icon={Phone} label="Phone" value={employee.contactNo} />
            <InfoRow icon={Cake} label="Date of Birth" value={employee.dob ? format(new Date(employee.dob), 'MMMM d, yyyy') : undefined} />
            <InfoRow icon={MapPin} label="Address" value={[employee.address, employee.city, employee.state, employee.pincode].filter(Boolean).join(', ')} />
          </div>
        </div>

        {/* Employment Info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Briefcase className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Employment Information</h2>
          </div>
          <div className="space-y-4">
            <InfoRow icon={FileText} label="Employee Type" value={employee.type} />
            <InfoRow icon={Calendar} label="Hire Date" value={employee.hireDate ? format(new Date(employee.hireDate), 'MMMM d, yyyy') : undefined} />
            {employee.dor && <InfoRow icon={Clock} label="Date of Release" value={format(new Date(employee.dor), 'MMMM d, yyyy')} />}
            {status && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <span className={cn(
                    'mt-0.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                    status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  )}>
                    {status}
                  </span>
                </div>
              </div>
            )}
            {revenueStatus && (
              <InfoRow icon={DollarSign} label="Revenue Status" value={revenueStatus === 'B' ? 'Billable' : 'Non-Billable'} />
            )}
          </div>
        </div>

        {/* Client Assignments */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Client Assignments</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{clientAssignmentNames.length}</span>
          </div>
          {clientAssignmentNames.length === 0 ? (
            <p className="text-sm text-slate-400">No client assignments</p>
          ) : (
            <div className="space-y-2">
              {clientAssignmentNames.map((a, i) => {
                const isActive = !a.endDate || new Date(a.endDate) >= new Date();
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                        {(a.startDate || a.endDate) && (
                          <p className="text-xs text-slate-500">
                            {a.startDate || '—'} → {a.endDate || 'Present'}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    )}>
                      {isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vendor Assignments */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Vendor Assignments</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{vendorAssignmentNames.length}</span>
          </div>
          {vendorAssignmentNames.length === 0 ? (
            <p className="text-sm text-slate-400">No vendor assignments</p>
          ) : (
            <div className="space-y-2">
              {vendorAssignmentNames.map((a, i) => {
                const isActive = !a.endDate || new Date(a.endDate) >= new Date();
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-bold text-white">
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                        {(a.startDate || a.endDate) && (
                          <p className="text-xs text-slate-500">
                            {a.startDate || '—'} → {a.endDate || 'Present'}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'
                    )}>
                      {isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Work Authorization */}
        {workAuth && employee.type !== 'Offshore' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Shield className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Work Authorization</h2>
            </div>
            <div className="space-y-4">
              <InfoRow icon={FileText} label="Authorization Type" value={workAuth.workAuthorization} />
              {workAuth.expiryDate && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Expiry Date</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{format(new Date(workAuth.expiryDate), 'MMMM d, yyyy')}</p>
                    {isAuthExpired && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        <XCircle className="h-3 w-3" />Expired
                      </span>
                    )}
                    {isAuthExpiringSoon && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="h-3 w-3" />Expiring Soon
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* India Tax Info */}
        {offshore && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">India Tax &amp; Provident Fund</h2>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Globe} label="Aadhar Number" value={offshore.aadharNumber} />
              <InfoRow icon={FileText} label="PAN Number" value={offshore.panNumber} />
              {offshore.pfNumber && <InfoRow icon={CreditCard} label="PF Number" value={offshore.pfNumber} />}
            </div>
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span><span className="font-medium text-slate-700">Created:</span> {format(new Date(employee.createdAt), 'MMMM d, yyyy h:mm a')}</span>
          <span><span className="font-medium text-slate-700">Updated:</span> {format(new Date(employee.updatedAt), 'MMMM d, yyyy h:mm a')}</span>
        </div>
      </div>
    </div>
  );
}
