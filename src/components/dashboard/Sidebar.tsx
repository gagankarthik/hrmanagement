'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Package,
  UserPlus, BarChart3, LogOut, Menu, X, Layers, PieChart,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Employees', href: '/dashboard/employees', icon: Users },
  { label: 'Clients', href: '/dashboard/clients', icon: Building2 },
  { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
  { label: 'Onboard', href: '/dashboard/onboard', icon: UserPlus },
  { label: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];

const STORAGE_KEY = 'zenhr:sidebar-collapsed';

function SidebarContent({
  onClose, collapsed = false, onToggleCollapse,
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (item: typeof nav[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'gap-2.5 px-5')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Layers className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-none text-slate-900">ZenHR</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Workforce Platform</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>
        )}
        <div className="space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'h-10 w-full justify-center px-0' : 'gap-3 px-3 py-2.5',
                  active
                    ? collapsed
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'border-l-[3px] border-indigo-600 bg-indigo-50 pl-[9px] text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')} />
                {!collapsed && item.label}
                {collapsed && active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-indigo-600" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User + collapse toggle */}
      <div className={cn('border-t border-slate-100', collapsed ? 'p-2' : 'p-3')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              title={user?.email ?? 'Profile'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
            >
              {initials}
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Expand sidebar"
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
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
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
                Collapse
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch { /* noop */ }
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };

  // Avoid SSR mismatch flicker — only render desktop chrome once hydrated
  const desktopWidth = collapsed ? 68 : 240;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
        aria-label="Open menu"
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

      {/* Desktop — reserves space + fixed-position content; both use the same width */}
      <div
        className="hidden shrink-0 transition-[width] duration-200 lg:block"
        style={{ width: hydrated ? desktopWidth : 240 }}
      >
        <div
          className="fixed inset-y-0 left-0 transition-[width] duration-200"
          style={{ width: hydrated ? desktopWidth : 240 }}
        >
          <SidebarContent collapsed={hydrated ? collapsed : false} onToggleCollapse={toggleCollapsed} />
        </div>
      </div>
    </>
  );
}
