'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCog, UserPlus, Mail, Search, Trash2, RotateCw, CheckCircle2, Clock,
  ShieldAlert, X, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ActionMenu } from '@/components/ui/action-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface AppUser {
  username: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  status?: string;
  enabled: boolean;
  createdAt?: string;
}

function statusInfo(u: AppUser): { label: string; cls: string; Icon: React.ElementType } {
  if (!u.enabled) return { label: 'Disabled', cls: 'bg-slate-100 text-slate-500 ring-slate-200', Icon: ShieldAlert };
  switch (u.status) {
    case 'CONFIRMED':
      return { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircle2 };
    case 'FORCE_CHANGE_PASSWORD':
      return { label: 'Invited · pending', cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: Clock };
    case 'RESET_REQUIRED':
      return { label: 'Reset required', cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: ShieldAlert };
    default:
      return { label: u.status || 'Unknown', cls: 'bg-slate-100 text-slate-600 ring-slate-200', Icon: Clock };
  }
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) setUsers(result.data as AppUser[]);
      else toast.error('Could not load users', result.error || 'Please try again.');
    } catch {
      toast.error('Could not load users', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.name, u.email].some((f) => f?.toLowerCase().includes(q)));
  }, [users, search]);

  const activeCount = users.filter((u) => u.enabled && u.status === 'CONFIRMED').length;
  const pendingCount = users.filter((u) => u.status === 'FORCE_CHANGE_PASSWORD').length;

  const closeInvite = () => { if (!submitting) { setInviteOpen(false); setEmail(''); setName(''); } };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to invite');
      toast.success('Invitation sent', `${email.trim()} will receive an email with a temporary password.`);
      setInviteOpen(false);
      setEmail('');
      setName('');
      fetchUsers();
    } catch (err) {
      toast.error('Could not send invite', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (u: AppUser) => {
    setResendingFor(u.username);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, name: u.name, resend: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to resend');
      toast.success('Invitation resent', `A new temporary password was emailed to ${u.email}.`);
    } catch (err) {
      toast.error('Could not resend invite', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setResendingFor(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(deleteTarget.username)}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to remove');
      toast.success('User removed', `${deleteTarget.email} can no longer sign in.`);
      setUsers((prev) => prev.filter((u) => u.username !== deleteTarget.username));
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Could not remove user', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        eyebrow="Administration"
        title="Users"
        description="Invite team members to Ocean Blue. They receive an email with a temporary password, then set their own on first sign-in."
        tone="brand"
        actions={
          <button onClick={() => setInviteOpen(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" /> Invite user
          </button>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Total users" value={users.length} icon={UserCog} tone="slate" hint="with sign-in access" />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} tone="emerald" hint="completed setup" />
        <StatCard label="Pending invites" value={pendingCount} icon={Clock} tone="amber" hint="awaiting first sign-in" />
      </StatGrid>

      <div className="surface">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-50"
            />
          </div>
          <button onClick={fetchUsers} className="btn-ghost px-3 py-2 text-sm">
            <RotateCw className={cn('h-4 w-4', isLoading && 'animate-spin')} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-5"><SkeletonTable rows={5} cols={4} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UserCog}
              tone="default"
              title={search ? 'No users match your search' : 'No users yet'}
              description={search ? 'Try a different search.' : 'Invite your first team member to give them access.'}
              action={!search ? (
                <button onClick={() => setInviteOpen(true)} className="btn-primary">
                  <UserPlus className="h-4 w-4" /> Invite user
                </button>
              ) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['User', 'Status', 'Invited', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const s = statusInfo(u);
                  const pending = u.status === 'FORCE_CHANGE_PASSWORD';
                  return (
                    <tr key={u.username} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                            {(u.name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{u.name || u.email?.split('@')[0] || 'User'}</p>
                            <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                              <Mail className="h-3 w-3" />{u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', s.cls)}>
                          <s.Icon className="h-3 w-3" /> {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
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
                              { label: 'Remove access', icon: Trash2, danger: true, separatorBefore: pending, onClick: () => setDeleteTarget(u) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">{filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={closeInvite} aria-hidden />
          <div role="dialog" aria-label="Invite user" className="surface relative w-full max-w-md overflow-hidden p-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
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
            <form onSubmit={handleInvite} className="space-y-4 px-5 py-5">
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
                />
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
    </div>
  );
}
