'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ShieldCheck, Clock, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { useAccess } from '@/hooks/useAccess';
import { useEmployees } from '@/context/EmployeeContext';
import { ROLE_LABELS, type AppRole } from '@/config/access';
import { friendlyError } from '@/lib/errors';
import { apiFetch } from '@/shared/lib/http/auth-fetch';
import type { Employee } from '@/types/employee';

interface AppUser {
  username: string;
  sub?: string;
  email: string;
  name?: string;
  status?: string;
  enabled: boolean;
  hrAccess: boolean;
  role?: AppRole;
}

function statusOf(u: AppUser): { label: string; tone: StatusTone; Icon: React.ElementType } {
  if (!u.enabled) return { label: 'Disabled', tone: 'neutral', Icon: ShieldAlert };
  if (u.status === 'FORCE_CHANGE_PASSWORD') return { label: 'Invited · pending', tone: 'warning', Icon: Clock };
  if (u.status === 'CONFIRMED') return { label: 'Active', tone: 'success', Icon: CheckCircle2 };
  return { label: u.status || 'Unknown', tone: 'neutral', Icon: Clock };
}

/**
 * Sign-in access for one employee, on their profile.
 *
 * Answers the two questions HR actually asks here: does this person have a way
 * into the portal, and are they allowed to use it right now. Inviting from this
 * card also links the new account to this employee record, which is what makes
 * their leave, attendance and documents resolve to them.
 *
 * HR and admins both administer accounts, so both get the controls here. An
 * admin or HR account itself is only changeable by an admin, matching the rule
 * /api/users enforces; anyone else just reads the state of play.
 */
export function EmployeePortalAccess({ employee }: { employee: Employee }) {
  const { admin, canManage } = useAccess();
  const { fetchEmployees } = useEmployees();
  const toast = useToast();

  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      const result = await res.json();
      if (result.success) setUsers(result.data as AppUser[]);
    } catch {
      // Leave `users` null — the card falls back to "couldn't check".
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // People sign in with whichever address they actually have — a company
  // mailbox for staff, a personal one for contractors and offshore hires. Offer
  // both and let the admin pick; whichever is chosen becomes their loginEmail.
  const emailChoices = useMemo(() => {
    const office = 'officeEmail' in employee ? employee.officeEmail?.trim() : undefined;
    const personal = employee.personalEmail?.trim();
    const out: { value: string; label: string }[] = [];
    if (office) out.push({ value: office, label: 'Company email' });
    if (personal && personal.toLowerCase() !== office?.toLowerCase()) {
      out.push({ value: personal, label: 'Personal email' });
    }
    return out;
  }, [employee]);

  const [inviteEmail, setInviteEmail] = useState('');
  useEffect(() => {
    // Default to the company address when there is one.
    setInviteEmail((current) =>
      current && emailChoices.some((c) => c.value === current) ? current : emailChoices[0]?.value ?? '',
    );
  }, [emailChoices]);

  // Same matching order the portal uses to resolve a login to a person.
  const account = useMemo(() => {
    if (!users) return undefined;
    if (employee.cognitoSub) {
      const bySub = users.find((u) => u.sub === employee.cognitoSub);
      if (bySub) return bySub;
    }
    const candidates = [employee.loginEmail, ...emailChoices.map((c) => c.value)]
      .filter(Boolean)
      .map((e) => e!.toLowerCase().trim());
    return users.find((u) => candidates.includes(u.email?.toLowerCase().trim()));
  }, [users, employee.cognitoSub, employee.loginEmail, emailChoices]);

  /** An admin/HR account is an admin's to change, in the UI and at the API. */
  const accountLocked = !admin && (account?.role === 'admin' || account?.role === 'hr');

  const setAccess = async (allowed: boolean) => {
    if (!account) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(account.username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrAccess: allowed }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      setUsers((prev) => prev?.map((u) => (u.username === account.username ? { ...u, hrAccess: allowed } : u)) ?? prev);
      toast.success(
        allowed ? 'Access granted' : 'Access restricted',
        `${employee.name} ${allowed ? 'can sign in to the portal.' : 'can no longer sign in to the portal.'}`,
      );
    } catch (err) {
      toast.error('Could not change access', friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const invite = async () => {
    if (!inviteEmail) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: employee.name, role: 'employee' }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Invite failed');

      // Tie the fresh account to this record so their own data resolves on
      // first sign-in instead of waiting for an email match.
      const sub = (result.data as AppUser)?.sub;
      if (sub) {
        await apiFetch('/api/employees/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sub, email: inviteEmail, employeeId: employee.id }),
        });
        await fetchEmployees();
      }

      toast.success('Invitation sent', `${inviteEmail} can set a password and sign in to self-service.`);
      await loadUsers();
    } catch (err) {
      toast.error('Could not invite', friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
        <h2 className="font-display text-sm font-bold text-slate-900">Portal access</h2>
      </div>

      {!canManage ? (
        <p className="text-sm text-slate-500">
          Sign-in accounts are managed by HR and administrators.
        </p>
      ) : loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking…
        </p>
      ) : !users ? (
        <p className="text-sm text-slate-500">Couldn&apos;t check sign-in accounts right now.</p>
      ) : account ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const s = statusOf(account);
              return <StatusBadge tone={s.tone} icon={s.Icon} label={s.label} />;
            })()}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {account.role ? ROLE_LABELS[account.role] : 'No role'}
            </span>
          </div>

          <p className="flex items-center gap-2 truncate text-sm text-slate-600">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{account.email}</span>
          </p>

          <div className="border-t border-slate-100 pt-3">
            <Switch
              checked={account.hrAccess}
              disabled={busy || accountLocked}
              onChange={setAccess}
              label={
                <span className="text-xs font-medium text-slate-600">
                  {account.hrAccess ? 'Allowed to sign in' : 'Blocked from signing in'}
                </span>
              }
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {accountLocked
                ? 'This is an Admin or HR account — only an administrator can change its access.'
                : 'Blocking keeps the account but shuts this person out of the portal.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            No sign-in yet. Invite them to self-service and they can apply for leave, mark
            attendance and read their own documents.
          </p>
          {emailChoices.length > 0 ? (
            <>
              {emailChoices.length === 1 ? (
                <p className="flex items-center gap-2 truncate text-sm text-slate-600">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{emailChoices[0].value}</span>
                </p>
              ) : (
                <fieldset className="space-y-1.5">
                  <legend className="mb-1 text-[0.7333rem] font-semibold uppercase tracking-wider text-slate-400">
                    Send the invitation to
                  </legend>
                  {emailChoices.map((c) => (
                    <label
                      key={c.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                        inviteEmail === c.value
                          ? 'border-brand-300 bg-brand-50/60'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="invite-email"
                        value={c.value}
                        checked={inviteEmail === c.value}
                        onChange={() => setInviteEmail(c.value)}
                        className="mt-0.5 h-3.5 w-3.5 accent-brand-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-500">{c.label}</span>
                        <span className="block truncate text-sm text-slate-700">{c.value}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              <button onClick={invite} disabled={busy || !inviteEmail} className="btn-primary w-full justify-center">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Invite to self-service
              </button>
              <p className="text-xs text-slate-400">
                Already signs in to the company website with a different address? Link that account
                from{' '}
                <Link href="/users" className="font-semibold text-brand-600 hover:underline">
                  Users
                </Link>{' '}
                instead of inviting a second one.
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">
              Add a company or personal email to this profile first — the invitation is sent to it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeePortalAccess;
