'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BRAND } from '@/config/brand';

const navLinks = [
  { href: '/#company', label: 'Who we are' },
  { href: '/#culture', label: 'Culture' },
  { href: '/#benefits', label: 'Benefits' },
  { href: '/platform', label: 'Platform' },
];

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center', className)} aria-label={`${BRAND.name} home`}>
      <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-7 w-auto object-contain md:h-9" />
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
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hz-cobalt)] text-xs font-bold text-white"
      style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)' }}
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
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--hz-line)] bg-white shadow-[var(--hz-shadow-md)] animate-in fade-in zoom-in-95 duration-100"
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
              href="/profile"
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
 * Landing site navigation — fixed, white at rest, frosted glass once scrolled
 * (the company-site header treatment), mobile floating panel, auth-aware.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, isLoading, user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut();
    } catch {
      /* signOut clears local state regardless; ignore network hiccups */
    }
  };

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-out',
        scrolled
          ? 'border-b border-white/40 bg-white/60 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-gray-100 bg-white',
      )}
    >
      <nav className="relative mx-auto w-full max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]" aria-label="Global">
        <div className="flex h-16 items-center justify-between md:h-[72px]">
          <Logo />

          {/* Center links */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:text-[var(--hz-cobalt)]"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right: auth-aware actions (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            {isLoading ? (
              <div className="flex items-center gap-2" aria-hidden>
                <div className="h-4 w-20 animate-pulse rounded-full bg-black/5" />
                <div className="h-9 w-24 animate-pulse rounded-full bg-black/5" />
              </div>
            ) : isAuthenticated ? (
              <UserMenu name={user?.name} email={user?.email} onSignOut={handleSignOut} />
            ) : (
              <Link
                href="/login"
                className="hz-btn-fill rounded-full bg-[var(--hz-cobalt)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-[var(--hz-text)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </nav>

      {/* Mobile floating panel */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-4 right-4 top-20 z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl sm:left-auto sm:w-96">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-black/5"
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

            <div className="mt-4 border-t border-gray-100 pt-4">
              {isLoading ? (
                <div className="space-y-3" aria-hidden>
                  <div className="h-10 w-full animate-pulse rounded-full bg-black/5" />
                  <div className="h-10 w-full animate-pulse rounded-full bg-black/5" />
                </div>
              ) : isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 px-1">
                    <Avatar name={user?.name} email={user?.email} />
                    {(user?.name || user?.email) && (
                      <span className="truncate text-sm font-medium text-slate-700">
                        {user?.name || user?.email}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="hz-btn-fill inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--hz-cobalt)] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
                    Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--hz-line-2)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)]"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="hz-btn-fill inline-flex w-full items-center justify-center rounded-full bg-[var(--hz-cobalt)] px-4 py-2.5 text-sm font-semibold text-white"
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
