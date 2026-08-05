'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCog, UserPlus, Mail, Search, Trash2, RotateCw, CheckCircle2, Clock,
  ShieldAlert, X, Loader2, AlertCircle, UserRoundCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { FilterSelect } from '@/components/ui/filter-select';
import { useToast } from '@/components/ui/toast';
import { INVITE_ROLE_OPTIONS, ROLE_LABELS, type AppRole } from '@/config/access';
import { cn } from '@/lib/utils';
import { friendlyError } from '@/lib/errors';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Avatar } from '@/components/ui/avatar';
import { Combobox } from '@/components/ui/combobox';
import { useAccess } from '@/hooks/useAccess';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/context/EmployeeContext';
import { apiFetch } from '@/shared/lib/http/auth-fetch';

interface AppUser {
  username: string;
  /** Immutable Cognito user id — what an employee record links to. */
  sub?: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  status?: string;
  enabled: boolean;
  hrAccess: boolean;
  role?: AppRole;
  createdAt?: string;
}

type RoleFilter = 'all' | 'none' | AppRole;
type StatusFilter = 'all' | 'active' | 'pending' | 'blocked';

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...INVITE_ROLE_OPTIONS.map((r) => ({ value: r as RoleFilter, label: ROLE_LABELS[r] })),
  { value: 'none', label: 'No role' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Invite pending' },
  { value: 'blocked', label: 'Blocked or disabled' },
];

function statusInfo(u: AppUser): { label: string; tone: StatusTone; Icon: React.ElementType } {
  if (!u.enabled) return { label: 'Disabled', tone: 'neutral', Icon: ShieldAlert };
  switch (u.status) {
    case 'CONFIRMED':
      return { label: 'Active', tone: 'success', Icon: CheckCircle2 };
    case 'FORCE_CHANGE_PASSWORD':
      return { label: 'Invited · pending', tone: 'warning', Icon: Clock };
    case 'RESET_REQUIRED':
      return { label: 'Reset required', tone: 'warning', Icon: ShieldAlert };
    default:
      return { label: u.status || 'Unknown', tone: 'neutral', Icon: Clock };
  }
}

export default function UsersPage() {
  const toast = useToast();
  const { employees, fetchEmployees } = useEmployees();
  const { admin, canManage } = useAccess();
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [linkingFor, setLinkingFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('employee');
  /** Employee record to attach the new login to, chosen during the invite. */
  const [inviteEmployeeId, setInviteEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** Account whose employee link is being chosen, plus that dialog's search. */
  const [linkTarget, setLinkTarget] = useState<AppUser | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const linkTrapRef = useFocusTrap<HTMLDivElement>(linkTarget !== null);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const inviteTrapRef = useFocusTrap<HTMLDivElement>(inviteOpen);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/users');
      const result = await res.json();
      if (result.success) setUsers(result.data as AppUser[]);
      else toast.error('Could not load users', result.error || 'Please try again.');
    } catch {
      toast.error('Could not load users', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { if (canManage) fetchUsers(); else setIsLoading(false); }, [canManage, fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || [u.name, u.email].some((f) => f?.toLowerCase().includes(q));
      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'none'
          ? !u.role
          : u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.enabled && u.status === 'CONFIRMED') ||
        (statusFilter === 'pending' && u.status === 'FORCE_CHANGE_PASSWORD') ||
        (statusFilter === 'blocked' && (!u.enabled || !u.hrAccess));
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /**
   * HR manages everyone except admins. The API enforces this too — this only
   * keeps HR from clicking controls that would come back 403.
   */
  const isLocked = (u: AppUser) => !admin && u.role === 'admin';

  /**
   * Whether the caller may edit this row's role.
   *
   * Admins may change anyone's, including their own — someone has to be able to
   * hand over, and there is no higher role to appeal to. HR may change other
   * people's but never an admin's and never their own, so nobody below admin
   * can rewrite their own level of access. The API enforces both; this only
   * keeps HR from clicking a control that would come back 403.
   */
  const isSelfRow = (u: AppUser) =>
    [u.username, u.sub, u.email].some(
      (id) => id && [user?.username, user?.userId, user?.email].some(
        (mine) => mine && mine.toLowerCase() === id.toLowerCase(),
      ),
    );
  const canEditRole = (u: AppUser) => admin || (!isLocked(u) && !isSelfRow(u));

  const activeCount = users.filter((u) => u.enabled && u.status === 'CONFIRMED').length;
  const pendingCount = users.filter((u) => u.status === 'FORCE_CHANGE_PASSWORD').length;

  const closeInvite = () => {
    if (!submitting) {
      setInviteOpen(false);
      setEmail('');
      setName('');
      setInviteRole('employee');
      setInviteEmployeeId('');
    }
  };

  /**
   * Roles this person may hand out. HR grants employee and hr; only an admin
   * grants admin (see shared/server/auth/role-limits.ts, which enforces it
   * server-side — this list only keeps the UI honest).
   */
  const assignableRoles = INVITE_ROLE_OPTIONS.filter((r) => admin || r !== 'admin');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role: inviteRole }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to invite');

      // Attach the new login to its employee record straight away. Doing it here
      // is what makes the Users page picker an exception handler rather than a
      // second step somebody has to remember: an employee whose login is not
      // linked cannot see their own documents or mark attendance.
      const sub = (result.data as { sub?: string } | undefined)?.sub;
      let linkNote = '';
      if (inviteEmployeeId && !sub) {
        toast.error(
          'Invited, but not linked',
          'Cognito did not return a user id for the new account. Link them from the Employee record column.',
        );
      } else if (inviteEmployeeId && sub) {
        try {
          const linkRes = await apiFetch('/api/employees/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sub, email: email.trim(), employeeId: inviteEmployeeId }),
          });
          const linkResult = await linkRes.json();
          if (!linkResult.success) throw new Error(linkResult.error || 'Link failed');
          const who = employees.find((emp) => emp.id === inviteEmployeeId)?.name;
          linkNote = who ? ` Linked to ${who}.` : '';
          await fetchEmployees();
        } catch (linkErr) {
          // The account exists either way, so this is a warning, not a failure.
          toast.error(
            'Invited, but not linked',
            `${friendlyError(linkErr)} Link them from the Employee record column.`,
          );
        }
      }

      toast.success(
        'Invitation sent',
        `${email.trim()} was invited as ${ROLE_LABELS[inviteRole]} and will receive an email with a temporary password.${linkNote}`,
      );
      setInviteOpen(false);
      setEmail('');
      setName('');
      setInviteRole('employee');
      setInviteEmployeeId('');
      fetchUsers();
    } catch (err) {
      toast.error('Could not send invite', friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (u: AppUser) => {
    setResendingFor(u.username);
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, name: u.name, resend: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to resend');
      toast.success('Invitation resent', `A new temporary password was emailed to ${u.email}.`);
    } catch (err) {
      toast.error('Could not resend invite', friendlyError(err));
    } finally {
      setResendingFor(null);
    }
  };

  // Patch role / HR-portal access. Optimistic with revert on failure.
  const updateMeta = async (u: AppUser, patch: Partial<Pick<AppUser, 'hrAccess' | 'role'>>) => {
    const prev = users;
    setUsers((list) => list.map((x) => (x.username === u.username ? { ...x, ...patch } : x)));
    setSavingFor(u.username);
    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(u.username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...('role' in patch ? { role: patch.role } : {}),
          ...('hrAccess' in patch ? { hrAccess: patch.hrAccess } : {}),
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      if ('role' in patch && patch.role) {
        toast.success('Role updated', `${u.email} is now ${ROLE_LABELS[patch.role]}. They'll see the change next time they sign in.`);
      } else if ('hrAccess' in patch) {
        toast.success(
          patch.hrAccess ? 'Portal access granted' : 'Portal access revoked',
          `${u.email} ${patch.hrAccess ? 'can now use' : 'can no longer use'} the portal.`,
        );
      }
    } catch (err) {
      setUsers(prev); // revert
      toast.error('Could not update user', friendlyError(err));
    } finally {
      setSavingFor(null);
    }
  };

  // ── Login ↔ employee link ───────────────────────────────────────────────────
  // A sign-in is not automatically a person in the HR database: accounts and
  // employee records are created separately, and one can exist without the
  // other. The invite modal links them at creation time, and most remaining
  // links form themselves the first time someone signs in with the email
  // already on their record. This column is where HR fixes what is left.
  const employeeOptions = useMemo(
    () => [
      { value: '', label: 'Not linked', sublabel: 'No employee record' },
      ...employees
        .filter((e) => e?.id)
        .map((e) => ({
          value: e.id,
          label: e.name,
          sublabel: [e.type, 'officeEmail' in e ? e.officeEmail : e.personalEmail].filter(Boolean).join(' · '),
        })),
    ],
    [employees],
  );

  const linkedEmployeeId = useCallback(
    (u: AppUser) => {
      const email = u.email?.toLowerCase().trim();
      const bySub = u.sub ? employees.find((e) => e.cognitoSub === u.sub) : undefined;
      if (bySub) return bySub.id;
      if (!email) return '';
      const byEmail = employees.find((e) => {
        if (e.loginEmail?.toLowerCase().trim() === email) return true;
        const office = 'officeEmail' in e ? e.officeEmail : undefined;
        return [office, e.personalEmail].some((x) => x?.toLowerCase().trim() === email);
      });
      return byEmail?.id ?? '';
    },
    [employees],
  );

  /**
   * An `employee` account with no employee record is a broken state, not a
   * configuration choice: they can sign in, but the portal cannot tell which
   * person they are, so their documents, payslips and attendance come back
   * empty and marking attendance is refused outright. Surfaced here rather than
   * left for the person it happens to to discover.
   */
  const unlinkedEmployeeCount = useMemo(
    () => users.filter((u) => u.role === 'employee' && !linkedEmployeeId(u)).length,
    [users, linkedEmployeeId],
  );

  const closeLinkDialog = () => {
    setLinkTarget(null);
    setLinkSearch('');
  };

  /** Employees matching the dialog's search, name or email, capped for the list. */
  const linkResults = useMemo(() => {
    const q = linkSearch.trim().toLowerCase();
    const all = employees.filter((e) => e?.id);
    if (!q) return all.slice(0, 50);
    return all
      .filter((e) => {
        const office = 'officeEmail' in e ? e.officeEmail : undefined;
        return [e.name, e.type, office, e.personalEmail].some((f) => f?.toLowerCase().includes(q));
      })
      .slice(0, 50);
  }, [employees, linkSearch]);

  const linkEmployee = async (u: AppUser, employeeId: string) => {
    if (!u.sub) {
      toast.error('Cannot link this account', 'Cognito did not return a user id for it.');
      return;
    }
    setLinkingFor(u.username);
    try {
      const res = await apiFetch('/api/employees/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub: u.sub, email: u.email, employeeId: employeeId || null }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Link failed');
      await fetchEmployees();
      const name = employees.find((e) => e.id === employeeId)?.name;
      toast.success(
        employeeId ? 'Login linked' : 'Login unlinked',
        employeeId
          ? `${u.email} now sees ${name}'s leave, attendance and documents.`
          : `${u.email} is no longer tied to an employee record.`,
      );
      closeLinkDialog();
    } catch (err) {
      toast.error('Could not link this login', friendlyError(err));
    } finally {
      setLinkingFor(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(deleteTarget.username)}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to remove');
      toast.success('User removed', `${deleteTarget.email} can no longer sign in.`);
      setUsers((prev) => prev.filter((u) => u.username !== deleteTarget.username));
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Could not remove user', friendlyError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<AppUser>[] = [
    {
      id: 'user',
      header: 'User',
      sortValue: (u) => (u.name || u.email || '').toLowerCase(),
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name || u.email} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{u.name || u.email?.split('@')[0] || 'User'}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
              <Mail className="h-3 w-3 shrink-0" />{u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (u) => statusInfo(u).label,
      cell: (u) => {
        const s = statusInfo(u);
        return <StatusBadge label={s.label} tone={s.tone} icon={s.Icon} />;
      },
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (u) => u.role ?? '',
      cell: (u) =>
        canEditRole(u) ? (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={u.role ?? ''}
              disabled={savingFor === u.username}
              onChange={(e) => updateMeta(u, { role: e.target.value as AppRole })}
              aria-label={`Role for ${u.email}`}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
            >
              {!u.role && <option value="">No role</option>}
              {assignableRoles.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        ) : u.role ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
            title={
              isSelfRow(u)
                ? 'You cannot change your own role. Ask an administrator.'
                : 'Only an administrator can change an Admin account.'
            }
          >
            <ShieldAlert className="h-3 w-3" strokeWidth={2} />
            {ROLE_LABELS[u.role as AppRole] ?? u.role}
          </span>
        ) : (
          <span className="text-sm text-slate-400">No role</span>
        ),
    },
    {
      id: 'employeeLink',
      header: 'Employee record',
      hideBelow: 'lg',
      sortValue: (u) => employees.find((e) => e.id === linkedEmployeeId(u))?.name ?? '',
      cell: (u) => {
        const linkedId = linkedEmployeeId(u);
        const linked = linkedId ? employees.find((e) => e.id === linkedId) : undefined;
        const busy = linkingFor === u.username;
        return (
          <div onClick={(e) => e.stopPropagation()} className="min-w-[190px]">
            <button
              type="button"
              onClick={() => setLinkTarget(u)}
              disabled={busy}
              className={cn(
                'group flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors disabled:opacity-60',
                linked
                  ? 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 hover:bg-emerald-50'
                  : 'border-red-100 bg-red-50/50 hover:border-red-200 hover:bg-red-50',
              )}
              title={linked ? `Linked to ${linked.name}` : 'This sign-in is not linked to an employee record'}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
              ) : linked ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8667rem] font-semibold text-slate-800">
                  {linked ? linked.name : 'Not linked'}
                </span>
                <span
                  className={cn(
                    'block text-[0.7333rem] font-semibold',
                    linked ? 'text-emerald-700' : 'text-red-600',
                  )}
                >
                  {linked ? 'Change now' : 'Link now'}
                </span>
              </span>
            </button>
          </div>
        );
      },
    },
    {
      id: 'hrAccess',
      header: 'Portal access',
      sortValue: (u) => (u.hrAccess ? 1 : 0),
      cell: (u) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
          <Switch
            checked={u.hrAccess}
            disabled={savingFor === u.username || isLocked(u)}
            onChange={(v) => updateMeta(u, { hrAccess: v })}
            label={<span className="text-xs">{u.hrAccess ? 'Allowed' : 'Blocked'}</span>}
          />
        </div>
      ),
    },
    {
      id: 'invited',
      header: 'Invited',
      hideBelow: 'sm',
      sortValue: (u) => u.createdAt ?? '',
      cell: (u) =>
        u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : <span className="text-slate-300">—</span>,
    },
  ];

  // HR and Admin both administer accounts; everyone else never reaches this
  // route (ProtectedRoute) and would be refused by /api/users anyway.
  if (!canManage) {
    return (
      <PageContainer>
        <div className="surface flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-xl font-bold text-brand-900">Not available</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Sign-in accounts are managed by HR and administrators.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={UserCog}
        eyebrow="Administration"
        title="Users"
        description={
          admin
            ? 'Invite people, set the role each one holds, and link their sign-in to an employee record so they see their own leave, attendance and documents.'
            : 'Invite people and link their sign-in to an employee record so they see their own leave, attendance and documents. Admin accounts are changed by an administrator.'
        }
        tone="brand"
        actions={
          <button onClick={() => setInviteOpen(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" /> Invite user
          </button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Total users" value={users.length} icon={UserCog} tone="slate" hint="with sign-in access" />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} tone="emerald" hint="completed setup" />
        <StatCard label="Pending invites" value={pendingCount} icon={Clock} tone="amber" hint="awaiting first sign-in" />
        <StatCard
          label="Needs linking"
          value={unlinkedEmployeeCount}
          icon={ShieldAlert}
          tone={unlinkedEmployeeCount > 0 ? 'red' : 'slate'}
          hint={unlinkedEmployeeCount > 0 ? 'employees with no record' : 'every employee is linked'}
        />
      </StatGrid>

      <div className="surface">
        <DataTable<AppUser>
          toolbar={
            <>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50"
                />
              </div>
              <FilterSelect label="Filter by role" value={roleFilter} onChange={setRoleFilter} options={ROLE_FILTERS} />
              <FilterSelect label="Filter by status" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
            </>
          }
          columns={columns}
          data={filtered}
          getRowId={(u) => u.username}
          caption="Users with sign-in access"
          tableId="users"
          isLoading={isLoading}
          minWidth="min-w-[960px]"
          rowActions={(u) => {
            const pending = u.status === 'FORCE_CHANGE_PASSWORD';
            return (
              <div className="flex items-center justify-end gap-1">
                {pending && (
                  <button
                    onClick={() => handleResend(u)}
                    disabled={resendingFor === u.username}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
                  >
                    {resendingFor === u.username ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                    Resend
                  </button>
                )}
                <ActionMenu
                  items={[
                    ...(pending ? [{ label: 'Resend invite', icon: RotateCw, onClick: () => handleResend(u) }] : []),
                    // Removing an admin or HR account is an admin decision.
                    ...(isLocked(u)
                      ? []
                      : [{ label: 'Remove access', icon: Trash2, danger: true, separatorBefore: pending, onClick: () => setDeleteTarget(u) }]),
                  ]}
                />
              </div>
            );
          }}
          empty={{
            icon: UserCog,
            tone: 'default',
            title: search ? 'No users match your search' : 'No users yet',
            description: search ? 'Try a different search.' : 'Invite your first team member to give them access.',
            action: !search ? (
              <button onClick={() => setInviteOpen(true)} className="btn-primary">
                <UserPlus className="h-4 w-4" /> Invite user
              </button>
            ) : undefined,
          }}
        />

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">{filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={closeInvite} aria-hidden />
          {/* max-h + a scrolling body, not overflow-hidden: this form is tall
              enough that on a phone the Send invite button fell off the bottom
              of the screen with no way to reach it. The header stays put. */}
          <div ref={inviteTrapRef} role="dialog" aria-modal="true" aria-label="Invite user" onKeyDown={(e) => { if (e.key === 'Escape' && !submitting) closeInvite(); }} className="surface relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden p-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 sm:max-h-[85dvh] sm:rounded-2xl">
            <div className="flex flex-none items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <UserPlus className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">Invite user</h2>
                  <p className="text-xs text-slate-400">They&apos;re emailed a temporary password automatically.</p>
                </div>
              </div>
              <button onClick={closeInvite} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                <X className="h-4.5 w-4.5" strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="invite-name" className="block text-sm font-medium text-slate-700">Full name <span className="text-slate-400">(optional)</span></label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  data-invite-name
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AppRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  {inviteRole === 'employee'
                    ? 'Employees see only their own record: their leave, attendance, documents and payslips, plus company handbook and policies.'
                    : 'HR and Admin run the whole portal. Admin additionally controls other admin accounts and data backups.'}
                </p>
                {!admin && (
                  <p className="text-xs text-slate-400">Admin accounts are created by an administrator.</p>
                )}
              </div>

              {/* Linking here saves the second step. Without a link the portal
                  cannot tell which person signed in, so an employee sees none of
                  their own documents, payslips or attendance. */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Employee record{inviteRole === 'employee' ? '' : ' (optional)'}
                </label>
                <Combobox
                  value={inviteEmployeeId}
                  onChange={setInviteEmployeeId}
                  options={employeeOptions}
                  placeholder="Search employees..."
                />
                {inviteRole === 'employee' && !inviteEmployeeId ? (
                  <p className="flex items-start gap-1.5 text-xs text-amber-600">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Without a linked record they can sign in, but their documents, payslips and
                      attendance will be empty. You can link them later from the table.
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Connects this sign-in to a person, so the portal can show them their own leave,
                    attendance and documents.
                  </p>
                )}
              </div>
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                They&apos;ll get an email with a temporary password, then set their own password, name and phone number on first sign-in.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={closeInvite} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 text-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {submitting ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee record picker.
          A dialog rather than an inline dropdown: this is a deliberate act with
          real consequences (it decides whose leave, attendance and documents a
          login can see), the list can be long enough to need searching, and a
          dropdown inside a horizontally scrolling table row is awkward to hit
          on a phone. */}
      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={closeLinkDialog}
            aria-hidden
          />
          <div
            ref={linkTrapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Link employee record"
            onKeyDown={(e) => { if (e.key === 'Escape') closeLinkDialog(); }}
            className="surface relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden p-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 sm:max-h-[80dvh] sm:rounded-2xl"
          >
            <div className="flex flex-none items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <UserRoundCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    {linkedEmployeeId(linkTarget) ? 'Change employee record' : 'Link employee record'}
                  </h2>
                  <p className="truncate text-xs text-slate-400">{linkTarget.email}</p>
                </div>
              </div>
              <button
                onClick={closeLinkDialog}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-none border-b border-slate-100 px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {linkResults.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">
                  No employee matches “{linkSearch.trim()}”.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {linkResults.map((e) => {
                    const isCurrent = linkedEmployeeId(linkTarget) === e.id;
                    const office = 'officeEmail' in e ? e.officeEmail : undefined;
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => linkEmployee(linkTarget, e.id)}
                          disabled={linkingFor === linkTarget.username}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:opacity-60',
                            isCurrent ? 'bg-emerald-50' : 'hover:bg-slate-50',
                          )}
                        >
                          <Avatar name={e.name} className="h-8 w-8 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800">{e.name}</span>
                            <span className="block truncate text-xs text-slate-400">
                              {[e.type, office || e.personalEmail].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          {isCurrent && (
                            <span className="flex shrink-0 items-center gap-1 text-[0.7333rem] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                              Linked
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-none items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
              {linkedEmployeeId(linkTarget) ? (
                <button
                  onClick={() => linkEmployee(linkTarget, '')}
                  disabled={linkingFor === linkTarget.username}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Unlink
                </button>
              ) : (
                <span className="text-xs text-slate-400">Sets whose records this login can see.</span>
              )}
              <button onClick={closeLinkDialog} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove user access"
        description={deleteTarget ? (
          <>
            Remove <span className="font-semibold text-slate-900">{deleteTarget.email}</span> from Ocean Blue? They will no longer be able to sign in. This does not delete any employee records.
          </>
        ) : null}
        confirmLabel="Remove access"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
