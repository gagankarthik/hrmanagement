'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  hasAppAccess,
  hasFullAccess,
  isSelfServiceOnly,
  isSelfServiceRouteAllowed,
  SELF_SERVICE_HOME,
  FULL_ACCESS_ROLES,
} from '@/config/access';
import { BRAND } from '@/config/brand';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, roles, hrAccess, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Access requires both an allowed role AND a non-revoked HR-portal flag.
  const allowed = hasAppAccess(roles) && hrAccess;
  const selfOnly = isSelfServiceOnly(roles);
  // Self-service users may only visit their allow-listed routes.
  const routeBlocked = selfOnly && !isSelfServiceRouteAllowed(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && routeBlocked) {
      router.replace(SELF_SERVICE_HOME);
    }
  }, [isLoading, isAuthenticated, routeBlocked, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-brand-100 dark:border-brand-900"></div>
            <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-brand-600"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-slate-900 dark:text-white">Loading...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Verifying authentication</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Self-service user on a page they can't see — don't flash it while redirecting.
  if (routeBlocked) {
    return null;
  }

  // Authenticated but not authorized at all.
  if (!allowed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] px-6">
        <div className="surface w-full max-w-md p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-xl font-bold text-brand-900">Access restricted</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Your account doesn&apos;t have permission to use the {BRAND.name} HR portal. Access is
            currently limited to {FULL_ACCESS_ROLES.map((r) => r.toUpperCase()).join(' and ')} roles.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Need access? Contact{' '}
            <a href={`mailto:${BRAND.contactEmail}`} className="font-semibold text-brand-700 hover:underline">
              {BRAND.contactEmail}
            </a>
            .
          </p>
          <button onClick={() => signOut()} className="btn-ghost mt-7 w-full justify-center">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
