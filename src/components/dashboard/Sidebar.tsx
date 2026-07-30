'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, UsersRound,
  BarChart3, X,
  PanelLeft, PanelLeftClose, BookOpen, ScrollText,
  HeartPulse, ShieldCheck, ClipboardList, UserCog,
  Wallet, CalendarDays, Network, FolderOpen,
  ClipboardCheck, DatabaseBackup,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAccess } from '@/hooks/useAccess';

type NavItem = { label: string; href: string; icon: React.ElementType; exact?: boolean; adminOnly?: boolean };
type NavSection = { heading: string; items: NavItem[] };

/** Limited nav for self-service (recruiter / sales) users. */
const selfServiceSections: NavSection[] = [
  {
    heading: 'My Portal',
    items: [
      { label: 'My Leave', href: '/my-leave', icon: CalendarDays },
      { label: 'My Documents', href: '/my-documents', icon: FolderOpen },
      { label: 'Handbook', href: '/handbook', icon: BookOpen },
      { label: 'Company Procedures', href: '/procedures', icon: ClipboardList },
      { label: 'Policies', href: '/policies', icon: ScrollText },
      { label: 'Benefits', href: '/benefits', icon: HeartPulse },
    ],
  },
];

const sections: NavSection[] = [
  {
    heading: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Employees', href: '/employees', icon: UsersRound },
      { label: 'Onboarding', href: '/onboard/packets', icon: ClipboardCheck },
      { label: 'Partners', href: '/partners', icon: Network },
      { label: 'Leave Management', href: '/leaves', icon: CalendarDays },
      { label: 'Billing', href: '/billing', icon: Wallet },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Handbook', href: '/handbook', icon: BookOpen },
      { label: 'Company Procedures', href: '/procedures', icon: ClipboardList },
      { label: 'Policies', href: '/policies', icon: ScrollText },
      { label: 'Benefits', href: '/benefits', icon: HeartPulse },
      { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: UserCog },
      { label: 'Backups', href: '/backup', icon: DatabaseBackup, adminOnly: true },
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
  const { selfServiceOnly, admin } = useAccess();

  // Self-service (recruiter / sales) users get the limited portal nav. Full-access
  // users see the full nav, with admin-only items (e.g. Backups) hidden from
  // non-admins (hr) and any section left empty by that filter dropped.
  const navSections = (selfServiceOnly ? selfServiceSections : sections)
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.adminOnly || admin) }))
    .filter((s) => s.items.length > 0);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex h-full flex-col bg-[var(--adm-chrome)]">
      {/* Logo row — matches the topbar height */}
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="Dashboard home">
          {collapsed ? (
            <Image src="/logo.png" alt="Ocean Blue" width={277} height={76} priority className="h-6 w-auto" />
          ) : (
            <Image src="/logo.png" alt="Ocean Blue" width={277} height={76} priority className="h-8 w-auto" />
          )}
        </Link>
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation — grouped under uppercase section labels */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navSections.map((section, si) => (
          <div key={section.heading} className={cn('space-y-0.5', si > 0 && 'mt-6')}>
            {collapsed ? (
              si > 0 && <div className="mx-1 mb-2 border-t border-[var(--adm-line)]" />
            ) : (
              <p className="px-3 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
                {section.heading}
              </p>
            )}
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
                    'group relative flex items-center gap-3 rounded-[8px] text-[14px] transition-colors duration-150',
                    collapsed ? 'justify-center p-2.5' : 'px-3 py-[9px]',
                    active
                      ? 'bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]'
                      : 'font-medium text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)]',
                  )}
                >
                  <Icon
                    strokeWidth={1.75}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      collapsed ? 'h-[21px] w-[21px]' : 'h-[18px] w-[18px]',
                      active ? 'text-[var(--adm-accent)]' : 'text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-ink)]',
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <div className="hidden px-2 py-2 lg:block">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-[var(--adm-ink-subtle)] transition-all hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]',
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
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
  const desktopWidth = collapsed ? 64 : 224;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} aria-hidden />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-56 transition-transform duration-300 ease-in-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent onClose={onMobileClose} />
      </div>

      {/* Desktop — reserves space + fixed-position content; both use the same width */}
      <div
        className="hidden shrink-0 transition-[width] duration-300 lg:block"
        style={{ width: hydrated ? desktopWidth : 224 }}
      >
        <div
          className="fixed inset-y-0 left-0 z-30 transition-[width] duration-300"
          style={{ width: hydrated ? desktopWidth : 224 }}
        >
          <SidebarContent collapsed={hydrated ? collapsed : false} onToggleCollapse={toggleCollapsed} />
        </div>
      </div>
    </>
  );
}
