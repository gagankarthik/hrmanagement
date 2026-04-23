'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  UserPlus,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  accentColor: string;
  activeBg: string;
  hoverBg: string;
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
    accentColor: 'text-indigo-400',
    activeBg: 'bg-indigo-500/20 border-l-2 border-indigo-400',
    hoverBg: 'hover:bg-indigo-500/10',
  },
  {
    label: 'Employees',
    href: '/dashboard/employees',
    icon: Users,
    accentColor: 'text-blue-400',
    activeBg: 'bg-blue-500/20 border-l-2 border-blue-400',
    hoverBg: 'hover:bg-blue-500/10',
  },
  {
    label: 'Clients',
    href: '/dashboard/clients',
    icon: Building2,
    accentColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/20 border-l-2 border-emerald-400',
    hoverBg: 'hover:bg-emerald-500/10',
  },
  {
    label: 'Vendors',
    href: '/dashboard/vendors',
    icon: Package,
    accentColor: 'text-purple-400',
    activeBg: 'bg-purple-500/20 border-l-2 border-purple-400',
    hoverBg: 'hover:bg-purple-500/10',
  },
  {
    label: 'Onboard',
    href: '/dashboard/onboard',
    icon: UserPlus,
    accentColor: 'text-orange-400',
    activeBg: 'bg-orange-500/20 border-l-2 border-orange-400',
    hoverBg: 'hover:bg-orange-500/10',
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    accentColor: 'text-rose-400',
    activeBg: 'bg-rose-500/20 border-l-2 border-rose-400',
    hoverBg: 'hover:bg-rose-500/10',
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-white">ZenHR</h1>
          <p className="text-xs text-slate-400">Workforce Management</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        <div className="space-y-0.5">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? cn('text-white', item.activeBg)
                    : cn('text-slate-400 hover:text-white', item.hoverBg)
                )}
              >
                <item.icon
                  className={cn(
                    'h-4.5 w-4.5 flex-shrink-0 transition-colors',
                    active ? item.accentColor : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="flex-1 leading-none">{item.label}</span>
                {active && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow">
            {user?.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-60 flex-shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-60">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
