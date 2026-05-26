'use client';

import React, { useEffect, useState } from 'react';
import { fetchUserAttributes, updateUserAttributes, updatePassword } from 'aws-amplify/auth';
import { UserRound, Mail, Phone, IdCard, KeyRound, Save, Loader2, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';

const E164 = /^\+[1-9]\d{6,14}$/;

function initialsOf(name?: string, email?: string) {
  const src = (name?.trim() || email || 'U').split(/[ @]/).filter(Boolean);
  return (src.map((s) => s[0]).slice(0, 2).join('') || 'U').toUpperCase();
}

export default function ProfilePage() {
  const { user, refreshSession, signOut } = useAuth();
  const toast = useToast();

  // Profile details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingAttrs, setLoadingAttrs] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (!active) return;
        setName(attrs.name ?? user?.name ?? '');
        setPhone(attrs.phone_number ?? '');
      } catch {
        if (active) setName(user?.name ?? '');
      } finally {
        if (active) setLoadingAttrs(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.name]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !E164.test(phone.trim())) {
      toast.error('Invalid phone number', 'Use international format, e.g. +14155552671.');
      return;
    }
    setSavingProfile(true);
    try {
      const userAttributes: Record<string, string> = {};
      if (name.trim()) userAttributes.name = name.trim();
      // Allow clearing the phone by sending an empty string.
      userAttributes.phone_number = phone.trim();
      await updateUserAttributes({ userAttributes });
      await refreshSession();
      toast.success('Profile updated', 'Your account details have been saved.');
    } catch (err) {
      toast.error('Could not update profile', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', 'Re-enter your new password.');
      return;
    }
    setChangingPw(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed', 'Use your new password next time you sign in.');
    } catch (err) {
      toast.error('Could not change password', err instanceof Error ? err.message : 'Check your current password and try again.');
    } finally {
      setChangingPw(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        eyebrow="Account"
        title="Profile"
        description="Manage your account details and password."
        tone="brand"
        actions={
          <button onClick={() => signOut()} className="btn-ghost">
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
          </button>
        }
      />

      {/* Identity card */}
      <div className="surface flex items-center gap-4 p-5 sm:p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
          {initialsOf(name || user?.name, user?.email)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold text-slate-900">{name || user?.name || 'Your account'}</p>
          {user?.email && <p className="truncate text-sm text-slate-500">{user.email}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <form onSubmit={saveProfile} className="surface flex flex-col p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Profile details</h2>
          <p className="mt-1 text-sm text-slate-500">Your display name and contact number.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-name" className={labelCls}>Full name</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loadingAttrs}
                  placeholder="Your name"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-phone" className={labelCls}>Phone number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loadingAttrs}
                  placeholder="+14155552671"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">International format, e.g. +14155552671.</p>
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input value={user?.email ?? ''} disabled readOnly className={`${inputCls} pl-9`} />
              </div>
              <p className="mt-1 text-xs text-slate-400">Email is managed by your administrator and can&apos;t be changed here.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={savingProfile || loadingAttrs} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
              Save changes
            </button>
          </div>
        </form>

        {/* Security */}
        <div className="flex flex-col gap-6">
          <form onSubmit={changePassword} className="surface flex flex-col p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Change password</h2>
            <p className="mt-1 text-sm text-slate-500">Update the password you use to sign in.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="old-pw" className={labelCls}>Current password</label>
                <input id="old-pw" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="new-pw" className={labelCls}>New password</label>
                <input id="new-pw" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="confirm-pw" className={labelCls}>Confirm new password</label>
                <input id="confirm-pw" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={changingPw || !oldPassword || !newPassword} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {changingPw ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                Update password
              </button>
            </div>
          </form>

          {/* Account info */}
          <div className="surface p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <IdCard className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                <dt className="w-24 shrink-0 text-slate-400">Username</dt>
                <dd className="min-w-0 truncate font-medium text-slate-700">{user?.username ?? '—'}</dd>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                <dt className="w-24 shrink-0 text-slate-400">Email</dt>
                <dd className="min-w-0 truncate font-medium text-slate-700">{user?.email ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
