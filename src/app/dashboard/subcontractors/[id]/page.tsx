'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  UserCheck,
  Users,
  Mail,
  Phone,
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  Printer,
  Pencil,
  Trash2,
  Briefcase,
  FileText,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { AssignEmployeesModal } from '@/components/dashboard/AssignEmployeesModal';

const typeBadge: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

function SubcontractorDetailPageContent() {
  const params = useParams<{ id: string }>();
  const subcontractorId = params?.id ?? '';
  const router = useRouter();
  const toast = useToast();
  const { employees } = useEmployees();
  const { subcontractors, isLoading, deleteSubcontractor } = useSubcontractors();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const subcontractor = useMemo(() => {
    if (!subcontractorId) return undefined;
    return subcontractors.find((s) => s.id === subcontractorId);
  }, [subcontractors, subcontractorId]);

  const subconEmployees = useMemo(() => {
    if (!subcontractor) return [];
    return employees.filter((emp) => {
      const inAssignments = emp.subcontractorAssignments?.some((a) => a.subcontractorId === subcontractor.id);
      return inAssignments || emp.subcontractorId === subcontractor.id;
    });
  }, [employees, subcontractor]);

  const activeCount = useMemo(
    () => subconEmployees.filter((e) => 'status' in e && (e as { status: string }).status === 'Active').length,
    [subconEmployees]
  );

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    subconEmployees.forEach((e) => { dist[e.type] = (dist[e.type] || 0) + 1; });
    return dist;
  }, [subconEmployees]);

  const handleDelete = async () => {
    if (!subcontractor) return;
    setDeleting(true);
    try {
      await deleteSubcontractor(subcontractor.id);
      toast.success('Subcontractor deleted', `${subcontractor.name} has been removed.`);
      router.push('/dashboard/subcontractors');
    } catch (err) {
      toast.error('Failed to delete subcontractor', err instanceof Error ? err.message : 'Please try again.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handlePrint = () => {
    if (!subcontractor) return;
    const rows = subconEmployees.map((emp) => {
      const status = 'status' in emp ? (emp as { status: string }).status : '—';
      const workAuth = 'workAuthorization' in emp ? (emp as { workAuthorization?: string; expiryDate?: string }) : null;
      const isExpiring = workAuth?.expiryDate && new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000) && new Date(workAuth.expiryDate) >= new Date();
      return `<tr>
        <td>${emp.name}</td>
        <td>${emp.position || '—'}</td>
        <td>${emp.type}</td>
        <td>${status}</td>
        <td>${emp.hireDate ? format(new Date(emp.hireDate), 'MM/dd/yyyy') : '—'}</td>
        <td>${workAuth?.workAuthorization || '—'}${isExpiring ? ' ⚠' : ''}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${subcontractor.name} — Subcontractor Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0d9488; margin-bottom: 24px; }
      .header h1 { font-size: 24px; font-weight: 700; color: #0f766e; }
      .header p { color: #64748b; margin-top: 4px; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .badge-active { background: #d1fae5; color: #065f46; }
      .badge-inactive { background: #f1f5f9; color: #64748b; }
      .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
      .stat-card .num { font-size: 28px; font-weight: 700; color: #1e293b; }
      .stat-card .lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f8fafc; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      tr:hover td { background: #f8fafc; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>${subcontractor.name}</h1>
        <p>${subcontractor.contactPerson ? `Contact: ${subcontractor.contactPerson}` : ''}${subcontractor.email ? ` · ${subcontractor.email}` : ''}${subcontractor.phone ? ` · ${subcontractor.phone}` : ''}</p>
        <p style="margin-top:6px;"><span class="badge ${subcontractor.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${subcontractor.status}</span></p>
      </div>
      <div style="text-align:right;color:#64748b;font-size:12px;">
        <strong>Subcontractor Report</strong><br/>
        Generated: ${format(new Date(), 'MMMM d, yyyy')}<br/>
        ${subcontractor.address ? subcontractor.address : ''}
      </div>
    </div>
    <div class="stats">
      <div class="stat-card"><div class="num">${subconEmployees.length}</div><div class="lbl">Total Employees</div></div>
      <div class="stat-card"><div class="num">${activeCount}</div><div class="lbl">Active</div></div>
      <div class="stat-card"><div class="num">${typeDistribution.W2 || 0}</div><div class="lbl">W2</div></div>
      <div class="stat-card"><div class="num">${typeDistribution.Contract || 0}</div><div class="lbl">Contract</div></div>
    </div>
    <div class="section-title">Employee Roster</div>
    <table>
      <thead><tr><th>Name</th><th>Position</th><th>Type</th><th>Status</th><th>Hire Date</th><th>Work Auth</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No employees</td></tr>'}</tbody>
    </table>
    <div class="footer">
      <span>Cadre Workforce Management</span>
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
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Subcontractor Not Found"
        description="We couldn't find that subcontractor. They may have been deleted or the link is invalid."
        action={
          <button
            onClick={() => router.push('/dashboard/subcontractors')}
            className="btn-primary"
          >
            Back to Subcontractors
          </button>
        }
        className="mt-12"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Nav + actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/subcontractors')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subcontractors
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-ghost">
            <Printer className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => router.push(`/dashboard/subcontractors/${subcontractor.id}/edit`)}
            className="btn-primary"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <ActionMenu
            items={[
              {
                label: 'Edit',
                icon: Pencil,
                onClick: () => router.push(`/dashboard/subcontractors/${subcontractor.id}/edit`),
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                separatorBefore: true,
                onClick: () => setConfirmOpen(true),
              },
            ] satisfies ActionMenuItem[]}
          />
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-bold">
            {subcontractor.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{subcontractor.name}</h1>
            {subcontractor.address && (
              <p className="mt-0.5 flex items-center gap-1 text-white/80 truncate">
                <MapPin className="h-3.5 w-3.5" />{subcontractor.address}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                subcontractor.status === 'Active' ? 'bg-emerald-400/30 text-white' : 'bg-red-400/30 text-white'
              )}>
                {subcontractor.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {subcontractor.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                <Users className="h-3 w-3" />{subconEmployees.length} Employees
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: subconEmployees.length, bg: 'bg-teal-100', color: 'text-teal-600', icon: Users },
          { label: 'Active', value: activeCount, bg: 'bg-emerald-100', color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'W2', value: typeDistribution.W2 || 0, bg: 'bg-blue-100', color: 'text-blue-600', icon: Briefcase },
          { label: 'Contract', value: typeDistribution.Contract || 0, bg: 'bg-purple-100', color: 'text-purple-600', icon: FileText },
        ].map((s) => (
          <div key={s.label} className="surface flex items-center gap-3 p-4">
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', s.bg)}>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <UserCheck className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Subcontractor Information</h2>
          </div>
          <div className="space-y-4">
            {subcontractor.contactPerson && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Contact Person</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{subcontractor.contactPerson}</p>
                </div>
              </div>
            )}
            {subcontractor.email && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{subcontractor.email}</p>
                </div>
              </div>
            )}
            {subcontractor.phone && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{subcontractor.phone}</p>
                </div>
              </div>
            )}
            {subcontractor.address && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Address</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{subcontractor.address}</p>
                </div>
              </div>
            )}
            {!subcontractor.contactPerson && !subcontractor.email && !subcontractor.phone && !subcontractor.address && (
              <p className="text-sm text-slate-400">No contact details on record.</p>
            )}
          </div>
        </div>

        {/* Type breakdown */}
        <div className="surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <FileText className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Employee Type Breakdown</h2>
          </div>
          {subconEmployees.length === 0 ? (
            <p className="text-sm text-slate-400">No employees assigned</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[type] || 'bg-slate-100 text-slate-600')}>
                    {type}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-slate-100 w-28">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{ width: `${(count / subconEmployees.length) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            {format(new Date(subcontractor.createdAt), 'MMM d, yyyy')} — {format(new Date(subcontractor.updatedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Employees table */}
      <div className="surface">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <Users className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Employees</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{subconEmployees.length}</span>
          </div>
          <button
            onClick={() => setAssignOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add employees
          </button>
        </div>

        {subconEmployees.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              tone="default"
              title="No employees assigned"
              description="When you assign employees to this subcontractor they'll appear here."
              action={
                <button onClick={() => setAssignOpen(true)} className="btn-primary">
                  <UserPlus className="h-4 w-4" /> Add employees
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="min-w-[720px] divide-y divide-slate-50">
            <div className="grid grid-cols-[2fr_1.5fr_80px_90px_100px_80px] gap-3 px-5 py-3">
              {['Employee', 'Position', 'Type', 'Status', 'Hire Date', ''].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>
            {subconEmployees.map((emp, idx) => {
              const status = 'status' in emp ? (emp as { status: string }).status : null;
              const workAuth = 'expiryDate' in emp ? (emp as { expiryDate?: string }) : null;
              const isExpiring = workAuth?.expiryDate &&
                new Date(workAuth.expiryDate) > new Date() &&
                new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000);
              return (
                <div
                  key={emp.id ?? idx}
                  className="grid cursor-pointer grid-cols-[2fr_1.5fr_80px_90px_100px_80px] items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                      {emp.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{emp.name}</p>
                      {emp.personalEmail && <p className="truncate text-xs text-slate-400">{emp.personalEmail}</p>}
                    </div>
                  </div>
                  <span className="truncate text-sm text-slate-600">{emp.position || '—'}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', typeBadge[emp.type] || 'bg-slate-100 text-slate-600')}>
                    {emp.type}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    status === 'Active' ? 'bg-emerald-100 text-emerald-700' : status ? 'bg-slate-100 text-slate-600' : 'text-slate-400'
                  )}>
                    {status || '—'}
                  </span>
                  <span className="text-sm text-slate-600">
                    {emp.hireDate ? format(new Date(emp.hireDate), 'MM/dd/yyyy') : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employees/${emp.id}`); }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Showing {subconEmployees.length} employees</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Subcontractor"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{subcontractor.name}</span>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Subcontractor"
        isLoading={deleting}
      />

      <AssignEmployeesModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        partnerKind="subcontractors"
        partnerId={subcontractor.id}
        partnerName={subcontractor.name}
      />
    </div>
  );
}

export default function SubcontractorDetailPage() {
  return (
    <ErrorBoundary>
      <SubcontractorDetailPageContent />
    </ErrorBoundary>
  );
}
