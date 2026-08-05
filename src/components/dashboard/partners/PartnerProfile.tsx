'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle2, Eye, Mail, MapPin, Pencil, Phone, Printer,
  Trash2, UserPlus, Users, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { printPartnerReport } from '@/lib/partner-report';
import { formatAddress, hasAddress } from '@/lib/address';
import { EMPLOYEE_TYPES } from '@/features/employees/domain/employee.types';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackLink, type PartnersTab } from '@/components/dashboard/BackLink';
import { AssignEmployeesModal } from '@/components/dashboard/AssignEmployeesModal';
import { ActionMenu } from '@/components/ui/action-menu';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { DetailField, SectionCard } from '@/components/ui/section-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { StatusBadge, statusTone } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';

/**
 * PartnerProfile — the single detail screen behind /clients/[id],
 * /endclients/[id], /vendors/[id] and /subcontractors/[id]. Those four pages
 * were near-identical 500-line copies; they now resolve their record plus the
 * employees assigned to it and hand both to this component, so the layout,
 * roster table, report and delete flow exist once.
 */

export interface PartnerProfileRecord {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  phoneExtension?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

/** Structural view of an Employee — only what this screen renders. */
export interface PartnerProfileEmployee {
  id: string;
  name: string;
  position?: string;
  type: string;
  status?: string;
  hireDate?: string;
  personalEmail?: string;
  workAuthorization?: string;
  expiryDate?: string;
  revenueStatus?: string;
}

export interface PartnerProfileProps {
  kind: PartnersTab;
  /** "Vendor" — used in titles, dialogs and the printed report. */
  singular: string;
  /** "Vendors" — the standalone list this record also lives on. */
  plural: string;
  icon: React.ElementType;
  /** Report accent colour (hex). */
  accent?: string;
  partner?: PartnerProfileRecord;
  employees: PartnerProfileEmployee[];
  isLoading: boolean;
  /** Deletes the record; rejects on failure. */
  onDelete: () => Promise<void>;
  /** Extra card rendered under the info grid (e.g. a subcontractor's COI). */
  extra?: React.ReactNode;
}

const EXPIRY_WARN_MS = 90 * 86_400_000;

const typeMeta = new Map(EMPLOYEE_TYPES.map((t) => [t.value as string, t]));

function TypePill({ type }: { type: string }) {
  const dot = typeMeta.get(type)?.dotColor ?? '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-[0.8rem] font-semibold text-[var(--adm-ink-mute)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      {type}
    </span>
  );
}

export function PartnerProfile({
  kind, singular, plural, icon: Icon, accent, partner, employees,
  isLoading, onDelete, extra,
}: PartnerProfileProps) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const listHref = `/${kind}`;
  const hubHref = `/partners?tab=${kind}`;

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'Active').length;
    const billable = employees.filter((e) => e.revenueStatus === 'B').length;
    const mix = EMPLOYEE_TYPES.map((t) => ({
      label: t.label,
      dot: t.dotColor,
      count: employees.filter((e) => e.type === t.value).length,
    })).filter((m) => m.count > 0);
    return { active, billable, inactive: employees.length - active, mix };
  }, [employees]);

  const handleDelete = async () => {
    if (!partner) return;
    setDeleting(true);
    try {
      await onDelete();
      toast.success(`${singular} deleted`, `${partner.name} has been removed.`);
      router.push(hubHref);
    } catch (err) {
      toast.error(`Failed to delete ${singular.toLowerCase()}`, friendlyError(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handlePrint = () => {
    if (!partner) return;
    const ok = printPartnerReport({
      partner: { ...partner, address: formatAddress(partner) },
      employees, singular, accent,
    });
    if (!ok) toast.error('Popup blocked', 'Allow popups for this site to print the report.');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-72" />
        <StatGrid cols={4}>{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</StatGrid>
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-52 w-full rounded-[10px]" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-[10px]" />
      </PageContainer>
    );
  }

  if (!partner) {
    return (
      <EmptyState
        icon={XCircle}
        tone="default"
        title={`${singular} not found`}
        description={`We couldn't find that ${singular.toLowerCase()}. It may have been deleted, or the link is out of date.`}
        action={<Link href={hubHref} className="btn-primary">Back to Partners</Link>}
        className="mt-12"
      />
    );
  }

  const fullAddress = formatAddress(partner);
  const hasContact = Boolean(partner.contactPerson || partner.email || partner.phone) || hasAddress(partner);

  const columns: DataTableColumn<PartnerProfileEmployee>[] = [
    {
      id: 'name',
      header: 'Employee',
      sortValue: (e) => e.name?.toLowerCase(),
      cell: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--adm-ink)]">{e.name}</p>
            {e.personalEmail && <p className="truncate text-xs text-[var(--adm-ink-subtle)]">{e.personalEmail}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'position',
      header: 'Position',
      hideBelow: 'md',
      sortValue: (e) => e.position?.toLowerCase(),
      cell: (e) => e.position || <span className="text-slate-300">—</span>,
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (e) => e.type,
      cell: (e) => <TypePill type={e.type} />,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (e) => e.status,
      cell: (e) => (e.status ? <StatusBadge label={e.status} tone={statusTone(e.status)} /> : <span className="text-slate-300">—</span>),
    },
    {
      id: 'hireDate',
      header: 'Hire date',
      hideBelow: 'lg',
      sortValue: (e) => e.hireDate,
      cell: (e) => formatDate(e.hireDate),
    },
    {
      id: 'workAuth',
      header: 'Work auth',
      hideBelow: 'lg',
      sortValue: (e) => e.workAuthorization,
      cell: (e) => {
        const expiring = Boolean(
          e.expiryDate &&
          new Date(e.expiryDate) > new Date() &&
          new Date(e.expiryDate) <= new Date(Date.now() + EXPIRY_WARN_MS),
        );
        if (!e.workAuthorization && !expiring) return <span className="text-slate-300">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5">
            {e.workAuthorization || '—'}
            {expiring && (
              <span className="inline-flex items-center gap-1 text-[var(--adm-warning)]" title={`Expires ${formatDate(e.expiryDate)}`}>
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <BackLink href={listHref} label={`Back to ${plural}`} partnersTab={kind} />

      <PageHeader
        title={partner.name}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge label={partner.status} tone={partner.status === 'Active' ? 'success' : 'danger'} />
            <span>{singular}</span>
            {fullAddress && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex max-w-xs items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{fullAddress}</span>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>Updated {formatDate(partner.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <button onClick={handlePrint} className="btn-ghost">
              <Printer className="h-4 w-4" strokeWidth={1.75} /> Export PDF
            </button>
            <Link href={`/${kind}/${partner.id}/edit`} className="btn-primary">
              <Pencil className="h-4 w-4" strokeWidth={1.75} /> Edit
            </Link>
            <ActionMenu
              items={[
                { label: 'Add employees', icon: UserPlus, onClick: () => setAssignOpen(true) },
                { label: 'Delete', icon: Trash2, danger: true, separatorBefore: true, onClick: () => setConfirmOpen(true) },
              ]}
            />
          </>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Employees" value={employees.length} icon={Users} hint={`assigned to this ${singular.toLowerCase()}`} />
        <StatCard label="Active" value={stats.active} icon={CheckCircle2} tone="emerald" hint={employees.length ? `${Math.round((stats.active / employees.length) * 100)}% of roster` : undefined} />
        <StatCard label="Terminated" value={stats.inactive} icon={XCircle} tone="red" />
        <StatCard label="Billable" value={stats.billable} icon={Icon} tone="brand" hint="revenue status B" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard icon={Icon} title={`${singular} details`}>
          {hasContact ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Contact person" value={partner.contactPerson} />
              <DetailField
                label="Email"
                value={partner.email && (
                  <a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--adm-accent)]">
                    <Mail className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />{partner.email}
                  </a>
                )}
              />
              <DetailField
                label="Phone"
                value={partner.phone && (
                  <a
                    href={`tel:${partner.phone}${partner.phoneExtension ? `;ext=${partner.phoneExtension}` : ''}`}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--adm-accent)]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
                    {partner.phone}
                    {partner.phoneExtension && (
                      <span className="text-[var(--adm-ink-mute)]">ext. {partner.phoneExtension}</span>
                    )}
                  </a>
                )}
              />
              <DetailField label="Address" value={partner.address} className="sm:col-span-2" />
              <DetailField label="City" value={partner.city} />
              <DetailField label="State" value={partner.state} />
              <DetailField label="ZIP" value={partner.zip} />
              <DetailField label="Country" value={partner.country} />
              <DetailField label="Added" value={formatDate(partner.createdAt)} />
              <DetailField label="Last updated" value={formatDate(partner.updatedAt)} />
            </dl>
          ) : (
            <p className="text-sm text-[var(--adm-ink-subtle)]">No contact details on record.</p>
          )}
        </SectionCard>

        <SectionCard icon={Users} title="Workforce mix" description="Assigned employees by engagement type">
          {stats.mix.length === 0 ? (
            <p className="text-sm text-[var(--adm-ink-subtle)]">No employees assigned yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.mix.map((m) => (
                <li key={m.label} className="flex items-center justify-between gap-3">
                  <TypePill type={m.label} />
                  <div className="flex flex-1 items-center justify-end gap-3">
                    <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[var(--adm-surface-2)]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${(m.count / employees.length) * 100}%`, backgroundColor: m.dot }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold tabular-nums text-[var(--adm-ink)]">{m.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {extra}

      <div className="surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[0.9333rem] font-semibold text-[var(--adm-ink)]">Employees</h2>
            <span className="rounded-full bg-[var(--adm-surface-2)] px-2 py-0.5 text-[0.8rem] font-medium text-[var(--adm-ink-mute)]">
              {employees.length}
            </span>
          </div>
          <button onClick={() => setAssignOpen(true)} className="btn-ghost">
            <UserPlus className="h-4 w-4" strokeWidth={1.75} /> Add employees
          </button>
        </div>

        <DataTable<PartnerProfileEmployee>
          columns={columns}
          data={employees}
          getRowId={(e) => e.id}
          caption={`Employees assigned to ${partner.name}`}
          onRowClick={(e) => router.push(`/employees/${e.id}`)}
          initialSort={{ columnId: 'name', dir: 'asc' }}
          tableId={`partner-roster-${kind}`}
          rowActions={(e) => (
            <button
              onClick={(evt) => { evt.stopPropagation(); router.push(`/employees/${e.id}`); }}
              aria-label={`View ${e.name}`}
              className={cn(
                'rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors',
                'hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]',
              )}
            >
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
          empty={{
            icon: Users,
            title: 'No employees assigned',
            description: `Assign employees to this ${singular.toLowerCase()} and they'll show up here.`,
            action: (
              <button onClick={() => setAssignOpen(true)} className="btn-primary">
                <UserPlus className="h-4 w-4" /> Add employees
              </button>
            ),
          }}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${singular}`}
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{partner.name}</span>? This action cannot be undone.
          </>
        }
        confirmLabel={`Delete ${singular}`}
        isLoading={deleting}
      />

      <AssignEmployeesModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        partnerKind={kind}
        partnerId={partner.id}
        partnerName={partner.name}
      />
    </PageContainer>
  );
}
