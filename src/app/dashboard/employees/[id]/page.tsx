'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useEndClients } from '@/context/EndClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useLeaves } from '@/context/LeaveContext';
import { useHandbook } from '@/context/HandbookContext';
import { useBenefits } from '@/context/BenefitsContext';
import { useI9 } from '@/context/I9Context';
import { useI983 } from '@/context/I983Context';
import { useEmployeeDocs } from '@/context/EmployeeDocsContext';
import { LeaveType } from '@/types/leave';
import { nextEvaluationDue } from '@/types/i983';
import { format } from 'date-fns';
import {
  ArrowLeft, Mail, Phone, Building2, Package, UserCheck,
  FileText, Shield, Trash2, XCircle, Printer,
  CheckCircle2, AlertTriangle, CalendarCheck, Hourglass, Pencil, HeartPulse,
  BadgeCheck, GraduationCap, FolderArchive, ChevronRight, ChevronDown, Download, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveName } from '@/lib/names';
import { ActionMenu } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import type { UploadedDoc } from '@/types/uploads';

/** Label-over-value field used in the tabbed detail grids. */
function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value || <span className="font-normal text-slate-400">N/A</span>}</div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
      <h3 className="font-display text-[15px] font-bold text-brand-900">{title}</h3>
      <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

type AssignmentItem = { name: string; startDate?: string; endDate?: string };
function AssignmentCard({ title, icon: Icon, tone, items }: { title: string; icon: React.ElementType; tone: string; items: AssignmentItem[] }) {
  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone)}><Icon className="h-4 w-4" /></div>
        <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No {title.toLowerCase()}</p>
      ) : (
        <div className="space-y-2">
          {items.map((a, i) => {
            const active = !a.endDate || new Date(a.endDate) >= new Date();
            return (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">{a.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                    {(a.startDate || a.endDate) && <p className="text-xs text-slate-500">{a.startDate || '—'} → {a.endDate || 'Present'}</p>}
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')}>{active ? 'Active' : 'Ended'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocRefList({ title, docs }: { title: string; docs?: UploadedDoc[] }) {
  if (!docs || docs.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="space-y-1.5">
        {docs.map((d) => (
          <a key={d.key} href={`/api/uploads/view?key=${encodeURIComponent(d.key)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand-200 hover:bg-white">
            <FileText className="h-4 w-4 shrink-0 text-brand-600" /><span className="truncate">{d.name}</span>
            <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

/** Self-contained Documents tab: inline upload to the employee's doc store + read-only refs to compliance-form docs. */
function DocsTab({ employeeId, employeeName, i9Docs, i983Docs }: { employeeId: string; employeeName: string; i9Docs?: UploadedDoc[]; i983Docs?: UploadedDoc[] }) {
  const { getByEmployee, saveRecord } = useEmployeeDocs();
  const rec = getByEmployee(employeeId);
  const [docs, setDocs] = React.useState<UploadedDoc[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    if (!hydrated && rec) { setDocs(rec.documents || []); setHydrated(true); }
  }, [rec, hydrated]);
  const onChange = async (next: UploadedDoc[]) => {
    setDocs(next);
    if (!hydrated) setHydrated(true);
    setSaving(true);
    try { await saveRecord({ employeeId, employeeName, documents: next }); } finally { setSaving(false); }
  };
  const hasCompliance = (i9Docs?.length || 0) + (i983Docs?.length || 0) > 0;
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <FolderArchive className="h-4 w-4 text-brand-600" />
          <h3 className="font-display text-[15px] font-bold text-brand-900">Documents</h3>
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
        </div>
        <DocumentUploader value={docs} onChange={onChange} folder={`employee-docs/${employeeId}`} label="" />
        <p className="mt-2 text-xs text-slate-400">Offers, IDs, certifications, contracts — everything for this employee in one place.</p>
      </div>
      {hasCompliance && (
        <div className="space-y-4 border-t border-dashed border-slate-200 pt-5">
          <p className="text-xs text-slate-500">Also attached to this employee&apos;s compliance forms:</p>
          <DocRefList title="Form I-9 documents" docs={i9Docs} />
          <DocRefList title="Form I-983 documents" docs={i983Docs} />
        </div>
      )}
    </div>
  );
}

const typeColors: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

type TabKey = 'details' | 'projects' | 'workauth' | 'forms' | 'i9' | 'docs' | 'notes';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'Employment Details' },
  { key: 'projects', label: 'Projects' },
  { key: 'workauth', label: 'Work Authorization' },
  { key: 'forms', label: 'Forms' },
  { key: 'i9', label: 'Form I-9' },
  { key: 'docs', label: 'Documents' },
  { key: 'notes', label: 'Notes' },
];

const tileBase = 'group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm';

function EmployeeDetailPageContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const employeeId = params?.id ?? '';
  const { employees, deleteEmployee, isLoading } = useEmployees();
  const { clients } = useClients();
  const { endClients } = useEndClients();
  const { vendors } = useVendors();
  const { subcontractors } = useSubcontractors();
  const { leaves } = useLeaves();
  const { getPolicy } = useHandbook();
  const { plans } = useBenefits();
  const { getByEmployee: getI9Record } = useI9();
  const { getByEmployee: getI983Record } = useI983();
  const { getByEmployee: getDocsRecord } = useEmployeeDocs();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>('details');

  const employee = useMemo(() => {
    if (!employeeId) return undefined;
    return employees.find((e) => e.id === employeeId);
  }, [employees, employeeId]);

  const clientAssignmentNames = useMemo(() => {
    if (!employee) return [];
    if (employee.clientAssignments?.length) {
      return employee.clientAssignments.map((a) => ({ ...a, name: resolveName(a.clientId, clients, { unknown: 'Unknown client' }) }));
    }
    if (employee.clientId) {
      const name = resolveName(employee.clientId, clients, { legacy: employee.client, unknown: 'Unknown client' });
      return [{ clientId: employee.clientId, name, startDate: undefined, endDate: undefined }];
    }
    if (employee.client) return [{ clientId: '', name: employee.client, startDate: undefined, endDate: undefined }];
    return [];
  }, [employee, clients]);

  const vendorAssignmentNames = useMemo(() => {
    if (!employee) return [];
    if (employee.vendorAssignments?.length) {
      return employee.vendorAssignments.map((a) => ({ ...a, name: resolveName(a.vendorId, vendors, { unknown: 'Unknown vendor' }) }));
    }
    if (employee.vendorId) {
      const name = resolveName(employee.vendorId, vendors, { legacy: employee.vendorName, unknown: 'Unknown vendor' });
      return [{ vendorId: employee.vendorId, name, startDate: undefined, endDate: undefined }];
    }
    if (employee.vendorName) return [{ vendorId: '', name: employee.vendorName, startDate: undefined, endDate: undefined }];
    return [];
  }, [employee, vendors]);

  const subcontractorAssignmentNames = useMemo(() => {
    if (!employee) return [];
    if (employee.subcontractorAssignments?.length) {
      return employee.subcontractorAssignments.map((a) => ({ ...a, name: resolveName(a.subcontractorId, subcontractors, { unknown: 'Unknown subcontractor' }) }));
    }
    if (employee.subcontractorId) {
      const name = resolveName(employee.subcontractorId, subcontractors, { unknown: 'Unknown subcontractor' });
      return [{ subcontractorId: employee.subcontractorId, name, startDate: undefined, endDate: undefined }];
    }
    return [];
  }, [employee, subcontractors]);

  const endClientAssignmentNames = useMemo(() => {
    if (!employee) return [];
    const list = employee.endClientAssignments?.length
      ? employee.endClientAssignments
      : (employee.endClientId ? [{ clientId: employee.endClientId, startDate: undefined, endDate: undefined }] : []);
    return list.map((a) => ({ ...a, name: resolveName(a.clientId, endClients, { unknown: resolveName(a.clientId, clients, { unknown: 'Unknown end client' }) }) }));
  }, [employee, endClients, clients]);

  const endVendorAssignmentNames = useMemo(() => {
    if (!employee) return [];
    const list = employee.endVendorAssignments?.length
      ? employee.endVendorAssignments
      : (employee.endVendorId ? [{ vendorId: employee.endVendorId, startDate: undefined, endDate: undefined }] : []);
    return list.map((a) => ({ ...a, name: resolveName(a.vendorId, vendors, { unknown: 'Unknown end vendor' }) }));
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

  const leaveBalance = useMemo(() => {
    if (!employee) return null;
    const allowance = getPolicy(employee.type).annualLeaveAllowance || 0;
    const mine = leaves.filter((l) => l.employeeId === employee.id);
    const approved = mine.filter((l) => l.status === 'Approved');
    const used = approved.reduce((sum, l) => sum + (l.days || 0), 0);
    const remaining = Math.max(0, allowance - used);
    const pendingCount = mine.filter((l) => l.status === 'Pending').length;
    const byType = new Map<LeaveType, number>();
    approved.forEach((l) => { byType.set(l.type, (byType.get(l.type) || 0) + (l.days || 0)); });
    const breakdown = Array.from(byType.entries()).filter(([, days]) => days > 0).sort((a, b) => b[1] - a[1]);
    const pct = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 0;
    const over = allowance > 0 && used > allowance;
    const nearLimit = allowance > 0 && !over && used / allowance >= 0.85;
    return { allowance, used, remaining, pendingCount, breakdown, pct, over, nearLimit };
  }, [employee, leaves, getPolicy]);

  const enrolledBenefits = useMemo(() => {
    if (!employee) return [];
    return plans.filter((p) => p.enrolledEmployeeIds?.includes(employee.id));
  }, [employee, plans]);

  const handleDelete = () => setDeleteOpen(true);

  const confirmDelete = async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(employeeId);
      toast.success('Employee deleted', `${employee.name} has been removed.`);
      router.push('/dashboard/employees');
    } catch (err) {
      toast.error('Failed to delete employee', err instanceof Error ? err.message : 'Please try again.');
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    if (!employee) return;
    const fmtAssign = (list: AssignmentItem[]) => (list.length
      ? list.map((a) => `${a.name}${a.startDate ? ` (${a.startDate}${a.endDate ? ` → ${a.endDate}` : ' → Present'})` : ''}`).join(', ')
      : 'N/A');
    const clientsText = fmtAssign(clientAssignmentNames);
    const vendorsText = fmtAssign(vendorAssignmentNames);
    const endClientsText = fmtAssign(endClientAssignmentNames);
    const endVendorsText = fmtAssign(endVendorAssignmentNames);

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
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #1d4ed8; margin-bottom: 24px; }
      .header-left h1 { font-size: 24px; font-weight: 700; color: #1d4ed8; }
      .header-left p { color: #64748b; margin-top: 4px; }
      .header-right { text-align: right; color: #64748b; font-size: 12px; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .badge-active { background: #d1fae5; color: #065f46; }
      .badge-terminated { background: #fee2e2; color: #991b1b; }
      .badge-type { background: #dbe6fe; color: #1d4ed8; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #266b55; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
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
          <tr><td class="label">End Client(s)</td><td>${endClientsText}</td></tr>
          <tr><td class="label">Vendor(s)</td><td>${vendorsText}</td></tr>
          <tr><td class="label">End Vendor(s)</td><td>${endVendorsText}</td></tr>
        </table>
      </div>
    </div>
    ${workAuthSection}
    ${indiaTaxSection}
    <div class="footer">
      <span>Ocean Blue Workforce Management</span>
      <span>Confidential — Internal Use Only</span>
    </div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
    </body></html>`);
    win.document.close();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-44" />
          <div className="flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-24" /></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Employee Not Found"
        description="We couldn't find that employee. They may have been deleted or the link is invalid."
        action={<button onClick={() => router.push('/dashboard/employees')} className="btn-primary">Back to Employees</button>}
        className="mt-12"
      />
    );
  }

  const status = 'status' in employee ? (employee as { status: string }).status : null;
  const workAuth = 'workAuthorization' in employee ? (employee as { workAuthorization?: string; expiryDate?: string }) : null;
  const pay = 'pay' in employee ? (employee as { pay?: number; salaryType?: string }) : null;
  const revenueStatus = 'revenueStatus' in employee ? (employee as { revenueStatus?: string }).revenueStatus : null;
  const offshore = employee.type === 'Offshore' && 'panNumber' in employee
    ? (employee as { panNumber?: string; aadharNumber?: string; pfNumber?: string; uanNumber?: string })
    : null;

  const officeEmail = (employee as { officeEmail?: string }).officeEmail;
  const contractorName = (employee as { contractorName?: string }).contractorName;
  const vonageNo = (employee as { vonageNo?: string }).vonageNo;
  const rehireDate = (employee as { rehireDate?: string }).rehireDate;
  const salaryType = (employee as { salaryType?: string }).salaryType;
  const subcontractorStatus = (employee as { subcontractorStatus?: string }).subcontractorStatus;
  const medicalBenefit = (employee as { medicalBenefit?: boolean }).medicalBenefit;
  const benefit401k = (employee as { benefit401k?: boolean }).benefit401k;
  const offshoreComp = employee.type === 'Offshore'
    ? (employee as { salary?: number; medicalReimbursement?: number; payrollEntity?: string; employmentType?: string })
    : null;
  const workCountry = (employee as { workCountry?: string }).workCountry;
  const i9Status2 = (employee as { i9Status?: string }).i9Status;
  const agreementStatus = (employee as { agreementStatus?: string }).agreementStatus;
  const gender = (employee as { gender?: string }).gender;
  const department = (employee as { department?: string }).department;
  const reportingManager = (employee as { reportingManager?: string }).reportingManager;

  const isAuthExpired = workAuth?.expiryDate && new Date(workAuth.expiryDate) < new Date();
  const isAuthExpiringSoon = workAuth?.expiryDate && !isAuthExpired && new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000);

  const i9Record = getI9Record(employeeId);
  const i983Record = getI983Record(employeeId);
  const docsRecord = getDocsRecord(employeeId);
  const i9Status = i9Record?.status ?? 'Not started';
  const i983Status = i983Record?.status ?? 'Not started';
  const docCount = docsRecord?.documents?.length ?? 0;
  const authHistCount = i9Record?.workAuthHistory?.length ?? 0;

  // Derived display values
  const nameParts = (employee.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
  const primaryClient = clients.find((c) => c.id === clientAssignmentNames[0]?.clientId);
  const currentProject = clientAssignmentNames[0];
  const fmt = (d?: string) => (d ? format(new Date(d), 'MM/dd/yyyy') : undefined);
  const wageRate = pay?.pay != null
    ? `$${pay.pay.toLocaleString()} / ${salaryType === 'Hourly' ? 'Hourly' : 'Yearly'}`
    : offshoreComp?.salary != null ? `$${offshoreComp.salary.toLocaleString()} / Monthly` : undefined;
  const benefitsList = [medicalBenefit && 'Medical', benefit401k && '401(k)'].filter(Boolean).join(', ');
  const i983Due = i983Record ? nextEvaluationDue(i983Record) : null;

  const alerts: { tone: 'red' | 'amber' | 'slate'; text: string }[] = [];
  if (isAuthExpired) alerts.push({ tone: 'red', text: 'Work authorization has expired' });
  else if (isAuthExpiringSoon) alerts.push({ tone: 'amber', text: 'Work authorization expires within 90 days' });
  if (workAuth && i9Status !== 'Verified' && i9Status !== 'E-Verified') alerts.push({ tone: 'amber', text: `Form I-9 ${i9Status === 'Not started' ? 'not started' : 'incomplete'}` });
  if (i983Due && i983Due.dueDate && (i983Due.overdue || i983Due.days <= 30)) alerts.push({ tone: i983Due.overdue ? 'red' : 'amber', text: `${i983Due.label} ${i983Due.overdue ? `${Math.abs(i983Due.days)}d overdue` : `due in ${i983Due.days}d`}` });
  if (docCount === 0) alerts.push({ tone: 'slate', text: 'No documents on file' });

  const alertDot = { red: 'bg-red-500', amber: 'bg-accent-400', slate: 'bg-slate-300' };

  const railField = (label: string, value?: React.ReactNode) => (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value || <span className="font-normal text-slate-400">N/A</span>}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/employees')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-white hover:shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </button>
        <div className="flex items-center gap-2.5">
          <button onClick={handlePrint} className="btn-ghost"><Printer className="h-4 w-4" /> Print / PDF</button>
          <FormsMenu employeeId={employeeId} />
          <Link href={`/dashboard/employees/${employeeId}/edit`} className="btn-primary"><Pencil className="h-4 w-4" /> Edit</Link>
          <ActionMenu items={[
            { label: 'Delete', icon: Trash2, onClick: handleDelete, danger: true },
          ]} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Left rail ── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white">{employee.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-brand-900">{employee.name}</p>
                <p className="truncate text-sm text-slate-500">{employee.position || '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', typeColors[employee.type] || 'bg-slate-100 text-slate-600')}>{employee.type}</span>
              {status && <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{status}</span>}
              {revenueStatus && <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{revenueStatus === 'B' ? 'Billable' : 'Non-Billable'}</span>}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {employee.personalEmail && <a href={`mailto:${employee.personalEmail}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-700"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{employee.personalEmail}</span></a>}
              {employee.contactNo && <span className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 shrink-0 text-slate-400" /> {employee.contactNo}</span>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
              {railField('Work Authorization', workAuth?.workAuthorization || workCountry)}
              {railField(workAuth?.workAuthorization?.includes('OPT') ? 'STEM OPT Validity' : 'Auth Expiry', fmt(workAuth?.expiryDate))}
              {railField('Project Start', fmt(currentProject?.startDate))}
              {railField('Project End', fmt(currentProject?.endDate))}
              {railField('Employment Start', fmt(employee.hireDate))}
              {railField('Reporting Manager', reportingManager)}
              {railField('Client Name', currentProject?.name)}
              {railField('End Client', endClientAssignmentNames[0]?.name)}
              {railField('Client Contact', primaryClient?.contactPerson || primaryClient?.email)}
            </div>
          </div>

          {/* Alerts */}
          <div className="surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-600" strokeWidth={1.75} />
              <h2 className="font-display text-sm font-bold text-slate-900">Alerts</h2>
              {alerts.length > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{alerts.length}</span>}
            </div>
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> All clear</p>
            ) : (
              <ul className="space-y-2.5">
                {alerts.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', alertDot[a.tone])} />{a.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Right pane: tabs ── */}
        <div className="surface min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-4">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn('relative whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors', tab === t.key ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800')}>
                {t.label}
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand-600" />}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {/* Employment Details */}
            {tab === 'details' && (
              <div className="space-y-6">
                <DetailSection title="Personal Details">
                  <Field label="First Name" value={firstName} />
                  <Field label="Middle Name" value={middleName} />
                  <Field label="Last Name" value={lastName} />
                  <Field label="Designation" value={employee.position} />
                  <Field label="Gender" value={gender} />
                  <Field label="Date of Birth" value={employee.dob ? `${format(new Date(employee.dob), 'MM/dd/yyyy')}${age != null ? ` (age ${age})` : ''}` : undefined} />
                </DetailSection>
                <DetailSection title="Contact Information">
                  <Field label="Email Address" value={employee.personalEmail} />
                  <Field label="Phone Number" value={employee.contactNo} />
                  {officeEmail && <Field label="Office Email" value={officeEmail} />}
                  {vonageNo && <Field label="Vonage Number" value={vonageNo} />}
                </DetailSection>
                <DetailSection title="Employment Details">
                  <Field label="Employment Type" value={offshoreComp?.employmentType || employee.type} />
                  <Field label="Employment Start" value={fmt(employee.hireDate)} />
                  <Field label="Period of Employment" value={yearsOfService != null ? `${yearsOfService} year(s)` : undefined} />
                  <Field label="Employee ID" value={employee.id.slice(0, 8).toUpperCase()} />
                  <Field label="Wage Rate" value={wageRate} />
                  <Field label="Department" value={department} />
                  <Field label="Reporting Manager" value={reportingManager} />
                  <Field label="Benefits Status" value={employee.type === 'W2' ? (benefitsList ? 'Applicable' : 'N/A') : undefined} />
                  <Field label="Benefits Type" value={benefitsList || undefined} />
                  {contractorName && <Field label="Contractor Name" value={contractorName} />}
                  {rehireDate && <Field label="Rehire Date" value={fmt(rehireDate)} />}
                  {employee.dor && <Field label="Date of Release" value={fmt(employee.dor)} />}
                  {subcontractorStatus && <Field label="Subcontractor Status" value={subcontractorStatus} />}
                </DetailSection>
                <DetailSection title="Current Home Address">
                  <Field label="Address" value={employee.address} />
                  <Field label="City, State" value={[employee.city, employee.state].filter(Boolean).join(', ')} />
                  <Field label="ZIP Code" value={employee.pincode} />
                  {offshoreComp?.payrollEntity && <Field label="Payroll Entity" value={offshoreComp.payrollEntity} />}
                </DetailSection>

                {/* Leave + Benefits */}
                <div className="grid gap-5 lg:grid-cols-2">
                  {leaveBalance && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-brand-600" />
                        <h3 className="font-display text-sm font-bold text-slate-900">Leave balance</h3>
                        {leaveBalance.pendingCount > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"><Hourglass className="h-3 w-3" />{leaveBalance.pendingCount}</span>}
                      </div>
                      {leaveBalance.allowance === 0 ? (
                        <p className="text-sm text-slate-500">No leave policy set. <Link href="/dashboard/policies" className="font-semibold text-brand-600">Configure →</Link></p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600"><span className="font-display text-xl font-bold text-slate-900">{leaveBalance.used}</span> of {leaveBalance.allowance} days used · <span className={cn('font-semibold', leaveBalance.over ? 'text-red-600' : 'text-brand-600')}>{leaveBalance.remaining} left</span></p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className={cn('h-full rounded-full', leaveBalance.over ? 'bg-red-500' : leaveBalance.nearLimit ? 'bg-amber-500' : 'bg-brand-500')} style={{ width: `${Math.max(leaveBalance.pct, leaveBalance.used > 0 ? 4 : 0)}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-pink-600" />
                      <h3 className="font-display text-sm font-bold text-slate-900">Benefits</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{enrolledBenefits.length}</span>
                    </div>
                    {enrolledBenefits.length === 0 ? (
                      <p className="text-sm text-slate-400">Not enrolled in any plans</p>
                    ) : (
                      <div className="space-y-2">
                        {enrolledBenefits.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p><p className="text-xs text-slate-500">{plan.type}</p></div>
                            {typeof plan.employerContribution === 'number' && <p className="text-sm font-semibold text-emerald-600">${plan.employerContribution.toLocaleString()}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Projects */}
            {tab === 'projects' && (
              <div className="grid gap-5 lg:grid-cols-2">
                <AssignmentCard title="Client Assignments" icon={Building2} tone="bg-emerald-100 text-emerald-600" items={clientAssignmentNames} />
                <AssignmentCard title="Vendor Assignments" icon={Package} tone="bg-purple-100 text-purple-600" items={vendorAssignmentNames} />
                <AssignmentCard title="Subcontractor Assignments" icon={UserCheck} tone="bg-teal-100 text-teal-600" items={subcontractorAssignmentNames} />
                <AssignmentCard title="End Client Assignments" icon={Building2} tone="bg-sky-100 text-sky-600" items={endClientAssignmentNames} />
                <AssignmentCard title="End Vendor Assignments" icon={Package} tone="bg-amber-100 text-amber-600" items={endVendorAssignmentNames} />
              </div>
            )}

            {/* Work Authorization */}
            {tab === 'workauth' && (
              <div className="space-y-6">
                <DetailSection title="Work Authorization">
                  <Field label="Authorization Type" value={workAuth?.workAuthorization} />
                  <Field label="Expiry Date" value={fmt(workAuth?.expiryDate)} />
                  <Field label="Work Country" value={workCountry} />
                  <Field label="I-9 / Eligibility" value={i9Status2} />
                  <Field label="Contractor Agreement" value={agreementStatus} />
                  {(isAuthExpired || isAuthExpiringSoon) && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', isAuthExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                        {isAuthExpired ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{isAuthExpired ? 'Expired' : 'Expiring soon'}
                      </span>
                    </div>
                  )}
                </DetailSection>

                {authHistCount > 0 && i9Record?.workAuthHistory && (
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-brand-900">Authorization history</h3>
                    <div className="mt-3 space-y-2">
                      {i9Record.workAuthHistory.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
                          <span className="font-semibold text-slate-900">{a.type || '—'}</span>
                          {a.number && <span className="text-slate-500">#{a.number}</span>}
                          <span className="text-slate-400">{fmt(a.issued) || '—'} → {fmt(a.expiry) || '—'}</span>
                          {a.status && <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{a.status}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {offshore && (
                  <DetailSection title="India Tax & Provident Fund">
                    <Field label="Aadhar Number" value={offshore.aadharNumber} />
                    <Field label="PAN Number" value={offshore.panNumber} />
                    <Field label="PF Number" value={offshore.pfNumber} />
                    <Field label="UAN No." value={offshore.uanNumber} />
                  </DetailSection>
                )}
                <Link href={`/dashboard/i9/${employeeId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">Manage work authorization & I-9 <ChevronRight className="h-4 w-4" /></Link>
              </div>
            )}

            {/* Forms */}
            {tab === 'forms' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/dashboard/i9/${employeeId}`} className={tileBase}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><BadgeCheck className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Form I-9 / E-Verify</p><p className="truncate text-sm font-bold text-slate-900">{i9Status}</p></div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </Link>
                <Link href={`/dashboard/i9/${employeeId}`} className={tileBase}>
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', isAuthExpired ? 'bg-red-50 text-red-600 ring-red-100' : isAuthExpiringSoon ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100')}><Shield className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Work authorization{authHistCount > 0 ? ` · ${authHistCount} on file` : ''}</p><p className="truncate text-sm font-bold text-slate-900">{workAuth?.workAuthorization || workCountry || 'Not set'}</p></div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </Link>
                <Link href={`/dashboard/i983/${employeeId}`} className={tileBase}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100"><GraduationCap className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Form I-983 · STEM OPT</p><p className="truncate text-sm font-bold text-slate-900">{i983Status}</p></div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </Link>
                <Link href={`/dashboard/documents/${employeeId}`} className={tileBase}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700 ring-1 ring-accent-100"><FolderArchive className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Documents</p><p className="truncate text-sm font-bold text-slate-900">{docCount} file{docCount !== 1 ? 's' : ''}</p></div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </Link>
              </div>
            )}

            {/* Form I-9 */}
            {tab === 'i9' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><BadgeCheck className="h-5 w-5" strokeWidth={1.75} /></span>
                    <div><p className="text-xs text-slate-500">Form I-9 / E-Verify status</p><p className="font-display text-base font-bold text-slate-900">{i9Status}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {i9Record && <a href={`/api/i9/${employeeId}/pdf`} target="_blank" rel="noreferrer" className="btn-ghost"><Download className="h-4 w-4" strokeWidth={1.75} /> Download filled I-9</a>}
                    <Link href={`/dashboard/i9/${employeeId}`} className="btn-primary">{i9Record ? 'Manage I-9' : 'Start I-9'}</Link>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Generates a pre-filled official USCIS Form I-9 from this employee&apos;s data, ready for review and signatures.</p>
              </div>
            )}

            {/* Documents */}
            {tab === 'docs' && (
              <DocsTab employeeId={employeeId} employeeName={employee.name} i9Docs={i9Record?.documents} i983Docs={i983Record?.documents} />
            )}

            {/* Notes */}
            {tab === 'notes' && (
              <div className="py-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} />
                <p className="mt-2 text-sm font-medium text-slate-500">No notes yet</p>
                <p className="text-xs text-slate-400">Use the audit trails on the I-9 and I-983 records for compliance history.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="surface px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span><span className="font-medium text-slate-700">Created:</span> {format(new Date(employee.createdAt), 'MMMM d, yyyy h:mm a')}</span>
          <span><span className="font-medium text-slate-700">Updated:</span> {format(new Date(employee.updatedAt), 'MMMM d, yyyy h:mm a')}</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        description={<>Are you sure you want to delete <span className="font-semibold text-slate-900">{employee.name}</span>? This action cannot be undone.</>}
        confirmLabel="Delete Employee"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <ErrorBoundary>
      <EmployeeDetailPageContent />
    </ErrorBoundary>
  );
}

/** "New form" dropdown — opens I-9 / I-983 for this employee (pre-selected via route). */
function FormsMenu({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const forms = [
    { label: 'Form I-9', icon: BadgeCheck, href: `/dashboard/i9/${employeeId}` },
    { label: 'Form I-983', icon: GraduationCap, href: `/dashboard/i983/${employeeId}` },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost"
      >
        <FileText className="h-4 w-4" /> New form
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open && (
        <div role="menu" className="surface absolute right-0 z-30 mt-2 w-56 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Create for this employee</p>
          {forms.map((f) => (
            <button
              key={f.href}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); router.push(f.href); }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <f.icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
