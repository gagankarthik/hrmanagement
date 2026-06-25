'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, UsersRound,
  BarChart3, X,
  PanelLeftClose, PanelLeftOpen, BookOpen, ScrollText,
  HeartPulse, ShieldCheck, ClipboardList, UserCog,
  LayoutGrid, Users, Wallet, CalendarDays, Network, Landmark, Settings, ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string; icon: React.ElementType; exact?: boolean };
/** `flat` sections render their items as standalone links — no collapsible header. */
type NavSection = { heading: string; items: NavItem[]; flat?: boolean };

const sections: NavSection[] = [
  {
    heading: 'Main',
    flat: true,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Employees', href: '/dashboard/employees', icon: UsersRound },
      { label: 'Partners', href: '/dashboard/partners', icon: Network },
      { label: 'Leave Management', href: '/dashboard/leaves', icon: CalendarDays },
      { label: 'Billing', href: '/dashboard/billing', icon: Wallet },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      { label: 'Handbook', href: '/dashboard/handbook', icon: BookOpen },
      { label: 'Company Procedures', href: '/dashboard/procedures', icon: ClipboardList },
      { label: 'Policies', href: '/dashboard/policies', icon: ScrollText },
      { label: 'Benefits', href: '/dashboard/benefits', icon: HeartPulse },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
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
  Dashboard: LayoutGrid,
  People: Users,
  'Time & Leave': CalendarDays,
  Billing: Wallet,
  Partners: Network,
  Company: Landmark,
  Administration: Settings,
};

const STORAGE_KEY = 'zenhr:sidebar-collapsed';
const NAV_SECTIONS_KEY = 'ob:nav-sections';

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

  // Collapsible sections (progressive disclosure): on first visit only the
  // active section is open; user toggles are persisted. The active section is
  // always kept open so you never lose your current location.
  const activeHeading = sections.find((s) => s.items.some(isActive))?.heading;
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let stored: Record<string, boolean> | null = null;
    try { const r = localStorage.getItem(NAV_SECTIONS_KEY); if (r) stored = JSON.parse(r); } catch { /* noop */ }
    const next: Record<string, boolean> = {};
    sections.forEach((s) => { next[s.heading] = stored ? !!stored[s.heading] : s.heading === activeHeading; });
    if (activeHeading) next[activeHeading] = true;
    setOpenMap(next);
  }, [activeHeading]);

  const toggleSection = (heading: string) => {
    setOpenMap((prev) => {
      const next = { ...prev, [heading]: !prev[heading] };
      try { localStorage.setItem(NAV_SECTIONS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-sm">
      {/* Logo + collapse toggle */}
      <div className={cn('flex h-14 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4')}>
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <>
            <Image
              src="/logo.png"
              alt="Ocean Blue"
              width={277}
              height={76}
              priority
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-0.5">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {sections.map((section, si) => {
          const sectionOpen = collapsed || section.flat || openMap[section.heading];
          const HeadingIcon = HEADING_ICONS[section.heading];
          return (
          <div key={section.heading} className={cn(si > 0 && (collapsed ? 'mt-3' : 'mt-2'))}>
            {!collapsed && !section.flat && (
              <button
                type="button"
                onClick={() => toggleSection(section.heading)}
                aria-expanded={sectionOpen}
                className="mb-1 mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              >
                {HeadingIcon && <HeadingIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />}
                {section.heading}
                <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform', !openMap[section.heading] && '-rotate-90')} strokeWidth={2} />
              </button>
            )}
            {collapsed && si > 0 && (
              <div className="mx-auto mb-2 h-px w-6 bg-slate-200" />
            )}
            {sectionOpen && (
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
            )}
          </div>
          );
        })}
      </nav>
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
