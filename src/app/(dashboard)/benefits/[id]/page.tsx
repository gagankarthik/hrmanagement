'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  HeartPulse,
  Building2,
  DollarSign,
  Users,
  FileText,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBenefits } from '@/context/BenefitsContext';
import { useEmployees } from '@/context/EmployeeContext';
import { BenefitType } from '@/types/benefits';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { SectionCard } from '@/components/ui/section-card';
import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

const typeChipStyles: Record<BenefitType, string> = {
  Medical: 'bg-rose-50 text-rose-700 ring-rose-200',
  Dental: 'bg-sky-50 text-sky-700 ring-sky-200',
  Vision: 'bg-violet-50 text-violet-700 ring-violet-200',
  '401k': 'bg-amber-50 text-amber-700 ring-amber-200',
  Life: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Disability: 'bg-orange-50 text-orange-700 ring-orange-200',
  Other: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function fmtMoney(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function BenefitDetailPageContent() {
  const params = useParams<{ id: string }>();
  const planId = params?.id ?? '';
  const router = useRouter();
  const toast = useToast();
  const { plans, isLoading, deleteBenefit } = useBenefits();
  const { employees } = useEmployees();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const plan = useMemo(() => {
    if (!planId) return undefined;
    return plans.find((p) => p.id === planId);
  }, [plans, planId]);

  const enrolled = useMemo(() => {
    if (!plan) return [];
    const ids = plan.enrolledEmployeeIds || [];
    return ids
      .map((id) => employees.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  }, [plan, employees]);

  const handleDelete = async () => {
    if (!plan) return;
    setDeleting(true);
    try {
      await deleteBenefit(plan.id);
      toast.success('Benefit deleted', `${plan.name} has been removed.`);
      router.push('/benefits');
    } catch (err) {
      toast.error('Failed to delete benefit', err instanceof Error ? err.message : 'Please try again.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title="Benefit Plan Not Found"
        description="We couldn't find that benefit plan. It may have been deleted or the link is invalid."
        action={
          <button onClick={() => router.push('/benefits')} className="btn-primary">
            Back to Benefits
          </button>
        }
        className="mt-12"
      />
    );
  }

  const cost = fmtMoney(plan.costPerMonth);
  const employer = fmtMoney(plan.employerContribution);

  return (
    <div className="space-y-6">
      {/* Nav + actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/benefits')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Benefits
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/benefits/${plan.id}/edit`)}
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
                onClick: () => router.push(`/benefits/${plan.id}/edit`),
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
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <HeartPulse className="h-9 w-9" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{plan.name}</h1>
            {plan.provider && (
              <p className="mt-0.5 flex items-center gap-1 text-white/80 truncate">
                <Building2 className="h-3.5 w-3.5" />{plan.provider}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {plan.type}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                plan.status === 'Active' ? 'bg-emerald-400/30 text-white' : 'bg-red-400/30 text-white'
              )}>
                {plan.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {plan.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                <Users className="h-3 w-3" />{enrolled.length} Enrolled
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan overview */}
        <SectionCard icon={HeartPulse} title="Plan Overview">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Type</span>
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', typeChipStyles[plan.type])}>
                {plan.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
              {plan.status === 'Active' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                  <XCircle className="h-3 w-3" /> Inactive
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
              <span className={cn('text-sm', plan.provider ? 'font-medium text-slate-800' : 'text-slate-300')}>
                {plan.provider || '—'}
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Eligibility</p>
              {plan.eligibility?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {plan.eligibility.map((e) => (
                    <span key={e} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {e}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-400">All categories</span>
              )}
            </div>

            {plan.description && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
              {format(new Date(plan.createdAt), 'MMM d, yyyy')} — {format(new Date(plan.updatedAt), 'MMM d, yyyy')}
            </div>
          </div>
        </SectionCard>

        {/* Cost & documents */}
        <SectionCard icon={DollarSign} title="Cost & Documents">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <DollarSign className="h-3 w-3" /> Cost / month
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">{cost ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <Building2 className="h-3 w-3" /> Employer
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">{employer ?? '—'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Plan Documents</p>
              {plan.documents?.length ? (
                <div className="space-y-1.5">
                  {plan.documents.map((doc) => (
                    <a
                      key={doc.key}
                      href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                      <span className="truncate">{doc.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No documents uploaded</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Enrolled employees */}
      <div className="surface">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <Users className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Enrolled Employees</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{enrolled.length}</span>
          </div>
        </div>

        {enrolled.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              tone="default"
              title="No employees enrolled"
              description="Edit this plan to enroll employees in it."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {enrolled.map((emp, idx) => (
              <div
                key={emp.id ?? idx}
                className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                onClick={() => router.push(`/employees/${emp.id}`)}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                  {emp.name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{emp.name}</p>
                  {emp.position && <p className="truncate text-xs text-slate-400">{emp.position}</p>}
                </div>
                <span className="hidden text-xs text-slate-400 sm:block">{emp.type}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.id}`); }}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Showing {enrolled.length} enrolled employee{enrolled.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Benefit Plan"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{plan.name}</span>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Plan"
        isLoading={deleting}
      />
    </div>
  );
}

export default function BenefitDetailPage() {
  return (
    <ErrorBoundary>
      <BenefitDetailPageContent />
    </ErrorBoundary>
  );
}
