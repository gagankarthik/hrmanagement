'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/ui/brand-mark';
import { BRAND } from '@/config/brand';

const navLinks = [
  { href: '#platform', label: 'Platform' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#trust', label: 'Security' },
];

const DEMO_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`${BRAND.name} demo`)}`;

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
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-[#f8fafc]/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />

        {/* Center links */}
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right: auth-aware actions (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {isLoading ? (
            // Neutral placeholder while auth resolves — no flicker, no crash
            <div className="flex items-center gap-3" aria-hidden>
              <div className="h-4 w-16 animate-pulse rounded-full bg-black/5" />
              <div className="h-9 w-28 animate-pulse rounded-full bg-black/5" />
            </div>
          ) : isAuthenticated ? (
            <>
              <span className="flex items-center gap-2.5">
                <Avatar name={user?.name} email={user?.email} />
                {displayName && (
                  <span className="max-w-[10rem] truncate text-sm font-medium text-slate-700">
                    {displayName}
                  </span>
                )}
              </span>
              <Link href="/dashboard" className="btn-primary">
                <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-brand-900 transition-colors hover:underline"
              >
                Log in
              </Link>
              <a href={DEMO_HREF} className="btn-ghost">
                Book a demo
              </a>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-900 hover:bg-black/5 lg:hidden"
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
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-ghost w-full"
                  >
                    Log in
                  </Link>
                  <a
                    href={DEMO_HREF}
                    onClick={() => setOpen(false)}
                    className="btn-ghost w-full"
                  >
                    Book a demo
                  </a>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full"
                  >
                    Get started
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
