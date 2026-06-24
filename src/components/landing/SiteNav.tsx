'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/ui/brand-mark';
import { BRAND } from '@/config/brand';

const navLinks = [
  { href: '#culture', label: 'Why us' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#join', label: 'Join us' },
];

function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label={`${BRAND.name} home`}>
      {onDark ? (
        <>
          <BrandMark size={36} variant="light" className="shadow-sm" />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            {BRAND.name}
          </span>
        </>
      ) : (
        <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-9 w-auto" />
      )}
    </Link>
  );
}

/** Derive up to two initials from a name or email for the avatar fallback. */
function initialsFrom(name?: string, email?: string) {
  const source = (name && name.trim()) || (email ? email.split('@')[0] : '');
  if (!source) return 'U';
  const parts = source.replace(/[._-]+/g, ' ').trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]).join('');
  return (letters || source[0] || 'U').toUpperCase();
}

function Avatar({ name, email }: { name?: string; email?: string }) {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white ring-1 ring-brand-700"
      aria-hidden
    >
      {initialsFrom(name, email)}
    </span>
  );
}

/** Authenticated profile control: avatar → dropdown with user info, dashboard, sign out. */
function UserMenu({ name, email, onSignOut }: { name?: string; email?: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const display = name || email;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-slate-100',
          open && 'bg-slate-100',
        )}
      >
        <Avatar name={name} email={email} />
        {display && (
          <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-700 sm:block">
            {display}
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="surface absolute right-0 mt-2 w-64 overflow-hidden p-0 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-3.5 py-3">
            <Avatar name={name} email={email} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{name || 'Signed in'}</p>
              {email && <p className="truncate text-xs text-slate-500">{email}</p>}
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} /> Dashboard
            </Link>
            <Link
              href="/dashboard/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Users className="h-4 w-4" strokeWidth={1.75} /> Your profile
            </Link>
            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Landing site navigation — sticky, on-brand, mobile-responsive, auth-aware.
 * Lives inside AuthProvider (wired in src/app/layout.tsx), so useAuth is safe here.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading, user, signOut } = useAuth();

  const displayName = user?.name || user?.email;

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut();
    } catch {
      /* signOut clears local state regardless; ignore network hiccups */
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Logo />

          {/* Center links */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right: auth-aware actions (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            {isLoading ? (
              // Neutral placeholder while auth resolves — no flicker, no crash
              <div className="flex items-center gap-2" aria-hidden>
                <div className="h-4 w-14 animate-pulse rounded-full bg-black/5" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-black/5" />
              </div>
            ) : isAuthenticated ? (
              <UserMenu name={user?.name} email={user?.email} onSignOut={handleSignOut} />
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-900"
                >
                  Request access
                </Link>
                <Link href="/login" className="btn-primary">
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-900 hover:bg-black/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-[#e2e8f0] bg-[#f8fafc] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-black/5"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-black/5"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="mt-4 border-t border-[#e2e8f0] pt-4">
              {isLoading ? (
                <div className="space-y-3" aria-hidden>
                  <div className="h-9 w-full animate-pulse rounded-full bg-black/5" />
                  <div className="h-9 w-full animate-pulse rounded-full bg-black/5" />
                </div>
              ) : isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 px-1">
                    <Avatar name={user?.name} email={user?.email} />
                    {displayName && (
                      <span className="truncate text-sm font-medium text-slate-700">
                        {displayName}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
                    Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn-ghost w-full"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="btn-ghost w-full"
                  >
                    Request access
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
