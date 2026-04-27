'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Package,
  UserPlus, BarChart3, LogOut, Menu, X, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Employees', href: '/dashboard/employees', icon: Users },
  { label: 'Clients', href: '/dashboard/clients', icon: Building2 },
  { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
  { label: 'Onboard', href: '/dashboard/onboard', icon: UserPlus },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (item: typeof nav[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Layers className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-none">ZenHR</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Workforce Platform</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>
        <div className="space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700 border-l-[3px] border-indigo-600 pl-[9px]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {user?.name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-200 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent onClose={() => setOpen(false)} />
      </div>

      {/* Desktop */}
      <div className="hidden w-60 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-60">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
