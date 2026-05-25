'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, UsersRound, Building2, Package, UserRoundCheck,
  UserRoundPlus, BarChart3, X,
  PanelLeftClose, PanelLeftOpen, CalendarOff, CalendarCheck, BookOpen, ScrollText,
  HeartPulse, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui/brand-mark';

type NavItem = { label: string; href: string; icon: React.ElementType; exact?: boolean };
type NavSection = { heading: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Employees', href: '/dashboard/employees', icon: UsersRound },
      { label: 'Onboard', href: '/dashboard/onboard', icon: UserRoundPlus },
    ],
  },
  {
    heading: 'Time & Leave',
    items: [
      { label: 'Leaves', href: '/dashboard/leaves', icon: CalendarOff },
      { label: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
    ],
  },
  {
    heading: 'Partners',
    items: [
      { label: 'Clients', href: '/dashboard/clients', icon: Building2 },
      { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
      { label: 'Subcontractors', href: '/dashboard/subcontractors', icon: UserRoundCheck },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Handbook', href: '/dashboard/handbook', icon: BookOpen },
      { label: 'Policies', href: '/dashboard/policies', icon: ScrollText },
      { label: 'Benefits', href: '/dashboard/benefits', icon: HeartPulse },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
    ],
  },
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

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex h-full flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-sm">
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        <BrandMark size={32} className="shadow-sm shadow-brand-900/15" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-bold leading-none text-slate-900">ZenHR</p>
            <p className="mt-0.5 text-[10px] tracking-wide text-slate-400">Workforce Platform</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {sections.map((section, si) => (
          <div key={section.heading} className={cn(si > 0 && (collapsed ? 'mt-3' : 'mt-3.5'))}>
            {!collapsed ? (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{section.heading}</p>
            ) : (
              si > 0 && <div className="mx-auto mb-2 h-px w-6 bg-slate-200" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                      collapsed ? 'h-9 w-full justify-center px-0' : 'gap-2.5 px-3 py-2',
                      active
                        ? 'bg-gradient-to-r from-brand-50 to-brand-50/60 text-brand-700 shadow-sm shadow-brand-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-brand-600" />
                    )}
                    <Icon strokeWidth={1.75} className={cn('h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')} />
                    {!collapsed && item.label}
                    {collapsed && active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-brand-600" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      {onToggleCollapse && (
        <div className={cn('border-t border-slate-100', collapsed ? 'p-2' : 'p-3')}>
          {collapsed ? (
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
              Collapse
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
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
  const desktopWidth = collapsed ? 60 : 220;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-200 lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent onClose={onMobileClose} />
      </div>

      {/* Desktop — reserves space + fixed-position content; both use the same width */}
      <div
        className="hidden shrink-0 transition-[width] duration-200 lg:block"
        style={{ width: hydrated ? desktopWidth : 220 }}
      >
        <div
          className="fixed inset-y-0 left-0 z-30 transition-[width] duration-200"
          style={{ width: hydrated ? desktopWidth : 220 }}
        >
          <SidebarContent collapsed={hydrated ? collapsed : false} onToggleCollapse={toggleCollapsed} />
        </div>
      </div>
    </>
  );
}
