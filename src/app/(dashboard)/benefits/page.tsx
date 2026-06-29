'use client';

import React, { useState, useMemo } from 'react';
import {
  HeartPulse, Plus, Eye, Pencil, Trash2, Search, CheckCircle2, XCircle,
  Stethoscope, Building2, FileText, DollarSign, Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useBenefits } from '@/context/BenefitsContext';
import { useEmployees } from '@/context/EmployeeContext';
import { useAccess } from '@/hooks/useAccess';
import { BenefitPlan, BenefitType } from '@/types/benefits';
import { cn } from '@/lib/utils';
import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { StatCard, StatGrid } from '@/components/ui/stat-card';

const BENEFIT_TYPES: BenefitType[] = ['Medical', 'Dental', 'Vision', '401k', 'Life', 'Disability', 'Other'];

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

function BenefitsContent() {
  const { plans, isLoading, deleteBenefit } = useBenefits();
  const { employees } = useEmployees();
  const { canManage } = useAccess();
  const toast = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | BenefitType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [deleteState, setDeleteState] = useState<{ benefit: BenefitPlan | null; isDeleting: boolean }>({
    benefit: null, isDeleting: false,
  });

  const validPlans = useMemo(() => plans.filter((p) => p && p.id), [plans]);

  const totalActive = validPlans.filter((p) => p.status === 'Active').length;
  const totalMedical = validPlans.filter((p) => p.type === 'Medical').length;

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => { if (e?.id) map.set(e.id, e.name); });
    return map;
  }, [employees]);

  const distinctEnrolled = useMemo(() => {
    const ids = new Set<string>();
    validPlans.forEach((p) => (p.enrolledEmployeeIds || []).forEach((id) => ids.add(id)));
    return ids.size;
  }, [validPlans]);

  const filtered = useMemo(() => validPlans.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.provider?.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [validPlans, searchQuery, typeFilter, statusFilter]);

  const confirmDelete = async () => {
    const benefit = deleteState.benefit;
    if (!benefit) return;
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteBenefit(benefit.id);
      toast.success('Benefit deleted', `${benefit.name} has been removed.`);
      setDeleteState({ benefit: null, isDeleting: false });
    } catch (err) {
      toast.error('Failed to delete benefit', err instanceof Error ? err.message : 'Please try again.');
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[112px] animate-pulse rounded-xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HeartPulse}
        eyebrow="Company"
        title="Benefits"
        description="Benefit plans and eligibility by employee category"
        tone="teal"
        actions={
          canManage ? (
            <button
              onClick={() => router.push('/benefits/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add plan
            </button>
          ) : undefined
        }
      />

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total plans" value={validPlans.length} icon={HeartPulse} tone="slate" hint="all on record" />
        <StatCard label="Active" value={totalActive} icon={CheckCircle2} tone="emerald" hint={validPlans.length ? `${Math.round((totalActive / validPlans.length) * 100)}% of total` : undefined} />
        <StatCard label="Medical plans" value={totalMedical} icon={Stethoscope} tone="pink" />
        <StatCard label="Enrolled employees" value={distinctEnrolled} icon={Users} tone="brand" hint="across all plans" />
      </StatGrid>

      {/* Toolbar */}
      <div className="surface">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | BenefitType)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50"
            >
              <option value="all">All types</option>
              {BENEFIT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {(['all', 'Active', 'Inactive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={HeartPulse}
              tone="default"
              title={searchQuery || typeFilter !== 'all' || statusFilter !== 'all' ? 'No plans match your filters' : 'No benefit plans yet'}
              description={searchQuery || typeFilter !== 'all' || statusFilter !== 'all' ? 'Try different keywords or clear filters.' : 'Add your first benefit plan to start managing coverage and eligibility.'}
              action={
                canManage && !(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') ? (
                  <button
                    onClick={() => router.push('/benefits/new')}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" /> Add plan
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((plan, idx) => {
                const cost = fmtMoney(plan.costPerMonth);
                const employer = fmtMoney(plan.employerContribution);
                const enrolledIds = plan.enrolledEmployeeIds || [];
                const enrolledCount = enrolledIds.length;
                const enrolledNames = enrolledIds
                  .map((id) => nameById.get(id))
                  .filter((n): n is string => Boolean(n));
                return (
                  <div
                    key={plan.id ?? idx}
                    onClick={canManage ? () => router.push(`/benefits/${plan.id}`) : undefined}
                    className={cn(
                      'surface-hover group flex flex-col rounded-2xl border border-slate-100 p-4 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]',
                      canManage && 'cursor-pointer',
                    )}
                    style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                          <HeartPulse className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p>
                          {plan.provider ? (
                            <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{plan.provider}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-300">No provider</p>
                          )}
                        </div>
                      </div>
                      {canManage && (
                      <div
                        className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionMenu
                          items={[
                            {
                              label: 'View',
                              icon: Eye,
                              onClick: () => router.push(`/benefits/${plan.id}`),
                            },
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
                              onClick: () => setDeleteState({ benefit: plan, isDeleting: false }),
                            },
                          ] satisfies ActionMenuItem[]}
                        />
                      </div>
                      )}
                    </div>

                    {/* Type + status chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', typeChipStyles[plan.type])}>
                        {plan.type}
                      </span>
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

                    {/* Eligibility */}
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Eligibility</p>
                      {plan.eligibility?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {plan.eligibility.map((e) => (
                            <span key={e} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {e}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">All categories</span>
                      )}
                    </div>

                    {/* Enrolled employees — hidden from self-service users
                        (they shouldn't see other people's enrollment). */}
                    {canManage && (
                      <div className="mt-3">
                        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <Users className="h-3 w-3" /> Enrolled · {enrolledCount}
                        </p>
                        {enrolledCount > 0 ? (
                          <p className="truncate text-xs text-slate-600">
                            {enrolledNames.slice(0, 2).join(', ')}
                            {enrolledCount > enrolledNames.slice(0, 2).length && (
                              <span className="text-slate-400">
                                {` +${enrolledCount - Math.min(2, enrolledNames.length)} more`}
                              </span>
                            )}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300">No employees enrolled</span>
                        )}
                      </div>
                    )}

                    {/* Cost / employer contribution */}
                    {(cost || employer) && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                          <p className="flex items-center gap-1 text-[11px] text-slate-400"><DollarSign className="h-3 w-3" /> Cost / mo</p>
                          <p className="text-sm font-semibold text-slate-800">{cost ?? '—'}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                          <p className="flex items-center gap-1 text-[11px] text-slate-400"><Building2 className="h-3 w-3" /> Employer</p>
                          <p className="text-sm font-semibold text-slate-800">{employer ?? '—'}</p>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {plan.description && (
                      <p className="mt-3 line-clamp-2 text-xs text-slate-500">{plan.description}</p>
                    )}

                    {/* Documents */}
                    {plan.documents?.length ? (
                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                        {plan.documents.map((doc) => (
                          <a
                            key={doc.key}
                            href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-brand-600"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                            <span className="truncate">{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {filtered.length} of {validPlans.length} plan{validPlans.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteState.benefit !== null}
        onClose={() => setDeleteState({ benefit: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Benefit Plan"
        description={
          deleteState.benefit ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{deleteState.benefit.name}</span>?
              This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Plan"
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}

export default function BenefitsPage() {
  return <BenefitsContent />;
}
