'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Auth-aware primary/secondary actions used in the hero and closing CTA.
 * Logged out  → "Get started" (signup) + "Log in".
 * Logged in   → "Go to dashboard".
 * Loading      → neutral pill placeholders (no flicker).
 */
export function HeroActions({ align = 'start' }: { align?: 'start' | 'center' }) {
  const { isAuthenticated, isLoading } = useAuth();

  const wrap =
    align === 'center'
      ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center'
      : 'flex flex-col gap-3 sm:flex-row sm:items-center';

  if (isLoading) {
    return (
      <div className={wrap} aria-hidden>
        <div className="h-12 w-44 animate-pulse rounded-full bg-black/5" />
        <div className="h-12 w-32 animate-pulse rounded-full bg-black/5" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={wrap}>
        <Link
          href="/dashboard"
          className="btn-accent group justify-center px-6 py-3 text-base sm:justify-start"
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <Link
        href="/signup"
        className="btn-primary group justify-center px-6 py-3 text-base sm:justify-start"
      >
        Get started
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
      </Link>
      <Link href="/login" className="btn-ghost justify-center px-6 py-3 text-base sm:justify-start">
        Log in
      </Link>
    </div>
  );
}
