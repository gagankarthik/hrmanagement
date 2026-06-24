'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, UsersRound, Building2, Package, UserRoundCheck,
  UserRoundPlus, BarChart3, X,
  PanelLeftClose, PanelLeftOpen, CalendarOff, CalendarCheck, BookOpen, ScrollText,
  HeartPulse, ShieldCheck, Target, ClipboardList, UserCog,
  TrendingUp, Clock, Receipt, Banknote, BadgeCheck, GraduationCap, FolderArchive,
  LayoutGrid, Users, Wallet, CalendarDays, Network, Landmark, Settings,
} from 'lucide-react';
import Image from 'next/image';
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
      { label: 'Documents', href: '/dashboard/documents', icon: FolderArchive },
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
    heading: 'Billing',
    items: [
      { label: 'Margins', href: '/dashboard/margins', icon: TrendingUp },
      { label: 'Timesheets', href: '/dashboard/timesheets', icon: Clock },
      { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
      { label: 'Payroll', href: '/dashboard/payroll', icon: Banknote },
    ],
  },
  {
    heading: 'Partners',
    items: [
      { label: 'Clients', href: '/dashboard/clients', icon: Building2 },
      { label: 'End Clients', href: '/dashboard/endclients', icon: Target },
      { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
      { label: 'Subcontractors', href: '/dashboard/subcontractors', icon: UserRoundCheck },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Handbook', href: '/dashboard/handbook', icon: BookOpen },
      { label: 'Company Procedures', href: '/dashboard/procedures', icon: ClipboardList },
      { label: 'Policies', href: '/dashboard/policies', icon: ScrollText },
      { label: 'Benefits', href: '/dashboard/benefits', icon: HeartPulse },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
      { label: 'Form I-9', href: '/dashboard/i9', icon: BadgeCheck },
      { label: 'Form I-983', href: '/dashboard/i983', icon: GraduationCap },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users', href: '/dashboard/users', icon: UserCog },
    ],
  },
];

const HEADING_ICONS: Record<string, React.ElementType> = {
  Overview: LayoutGrid,
  People: Users,
  'Time & Leave': CalendarDays,
  Billing: Wallet,
  Partners: Network,
  Company: Landmark,
  Administration: Settings,
};

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
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex h-full flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-sm">
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        {collapsed ? (
          <BrandMark size={32} className="shadow-sm shadow-brand-900/15" />
        ) : (
          <Image
            src="/logo.png"
            alt="Ocean Blue"
            width={277}
            height={76}
            priority
            className="h-8 w-auto"
          />
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
              <p className="mb-1 flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {HEADING_ICONS[section.heading] && React.createElement(HEADING_ICONS[section.heading], { className: 'h-3 w-3', strokeWidth: 2 })}
                {section.heading}
              </p>
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
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center rounded-lg text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
                      collapsed ? 'h-9 w-full justify-center px-0' : 'gap-2.5 px-3 py-2',
                      active
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600" />
                    )}
                    <Icon strokeWidth={1.75} className={cn('h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')} />
                    {!collapsed && item.label}
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
