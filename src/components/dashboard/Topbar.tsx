'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Menu, Bell, LogOut,
  UsersRound, Building2, Package, UserRoundCheck, CornerDownLeft, UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { ActivityDrawer } from '@/components/dashboard/ActivityDrawer';
import { Avatar } from '@/components/ui/avatar';
import { IconTimesheets, IconLeave } from '@/components/icons';

type Result = { key: string; label: string; sub?: string; group: string; href: string; icon: React.ElementType };

/**
 * Dismiss a popover by listening for pointer events outside `ref`.
 * Replaces `fixed inset-0` click-away overlays, which break when an ancestor
 * (e.g. the Topbar's `backdrop-blur` header) becomes the containing block for
 * fixed-positioned children and confines the overlay to the header.
 */
function useClickOutside<T extends HTMLElement>(enabled: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [enabled, onOutside]);
  return ref;
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { selfServiceOnly } = useAccess();
  const { employees } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { subcontractors } = useSubcontractors();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const name = user?.name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';

  const searchRef = useClickOutside<HTMLDivElement>(open, useCallback(() => setOpen(false), []));
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, useCallback(() => setMenuOpen(false), []));
  const notifRef = useClickOutside<HTMLDivElement>(activityOpen, useCallback(() => setActivityOpen(false), []));

  const q = query.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (!q) return [];
    const out: Result[] = [];
    employees
      .filter((e) => [e.name, e.position, e.personalEmail].some((f) => f?.toLowerCase().includes(q)))
      .slice(0, 5)
      .forEach((e) => out.push({ key: `e-${e.id}`, label: e.name, sub: e.position || e.type, group: 'People', href: `/employees/${e.id}`, icon: UsersRound }));
    clients
      .filter((c) => c?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) => out.push({ key: `c-${c.id}`, label: c.name, sub: 'Client', group: 'Clients', href: `/clients/${c.id}`, icon: Building2 }));
    vendors
      .filter((v) => v?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((v) => out.push({ key: `v-${v.id}`, label: v.name, sub: 'Vendor', group: 'Vendors', href: `/vendors/${v.id}`, icon: Package }));
    subcontractors
      .filter((s) => s?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((s) => out.push({ key: `s-${s.id}`, label: s.name, sub: 'Subcontractor', group: 'Subcontractors', href: `/subcontractors/${s.id}`, icon: UserRoundCheck }));
    return out;
  }, [q, employees, clients, vendors, subcontractors]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const searchAll = () => {
    const term = query.trim();
    setOpen(false);
    router.push(term ? `/employees?q=${encodeURIComponent(term)}` : '/employees');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && results[active]) go(results[active].href); else searchAll(); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <header className="relative z-30 flex h-16 items-center justify-between gap-3 bg-[var(--adm-chrome)] px-4 lg:px-6">
      {/* Left — mobile menu trigger */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Center — absolutely centered global search (full-access only;
          self-service users have no records to search and shouldn't see
          other people's data). */}
      {!selfServiceOnly && (
      <div className="absolute left-1/2 top-1/2 hidden w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-14 md:block">
      <div ref={searchRef} className="relative mx-auto w-full max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search people, clients, vendors…"
          className="h-9 w-full rounded-[8px] border border-[var(--adm-line-strong)]/60 bg-white pl-9 pr-3 text-sm text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)] outline-none transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
        />

        {open && q && (
          <>
            <div
              role="listbox"
              className="absolute left-0 right-0 z-20 mt-1.5 max-h-[70vh] overflow-y-auto rounded-[8px] border border-[var(--adm-line)] bg-white p-1.5 shadow-[var(--adm-shadow-pop)] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">No matches for &ldquo;{query.trim()}&rdquo;</p>
              ) : (
                results.map((r, i) => {
                  const showHeader = i === 0 || results[i - 1].group !== r.group;
                  const Icon = r.icon;
                  return (
                    <React.Fragment key={r.key}>
                      {showHeader && (
                        <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{r.group}</p>
                      )}
                      <button
                        type="button"
                        role="option"
                        aria-selected={active === i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(r.href)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                          active === i ? 'bg-brand-50' : 'hover:bg-slate-50'
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{r.label}</span>
                          {r.sub && <span className="block truncate text-xs text-slate-400">{r.sub}</span>}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
              <button
                type="button"
                onClick={searchAll}
                className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                Search all employees for &ldquo;{query.trim()}&rdquo;
              </button>
            </div>
          </>
        )}
      </div>
      </div>
      )}

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
        {/* Notifications → anchored dropdown panel (full-access only) */}
        {!selfServiceOnly && (
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setActivityOpen((v) => !v)}
            className={cn(
              'relative rounded-lg p-2 text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]',
              activityOpen && 'bg-[var(--adm-row-hover)] text-[var(--adm-ink)]',
            )}
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={activityOpen}
            title="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--adm-accent)]" />
          </button>
          <ActivityDrawer open={activityOpen} onClose={() => setActivityOpen(false)} />
        </div>
        )}

        <div className="mx-1 hidden h-6 w-px bg-[var(--adm-line-strong)] md:block" aria-hidden />

        {/* User dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center rounded-full border border-transparent p-0.5 transition-colors hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]',
              menuOpen && 'border-[var(--adm-line-strong)] bg-[var(--adm-row-hover)]',
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
          >
            <Avatar name={user?.name || user?.email} className="h-7 w-7 ring-2 ring-white/80" />
          </button>

          {menuOpen && (
            <>
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-white shadow-[var(--adm-shadow-pop)] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <Avatar name={user?.name || user?.email} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                    {email && <p className="truncate text-xs text-slate-400">{email}</p>}
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserRound className="h-4 w-4" strokeWidth={1.75} />
                    Profile
                  </button>
                  {/* Full-access users work the console all day but still have
                      their own time to mark — the ESS nav already links these. */}
                  {!selfServiceOnly && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); router.push('/my-attendance'); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <IconTimesheets className="h-4 w-4" />
                        My Attendance
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); router.push('/my-leave'); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <IconLeave className="h-4 w-4" />
                        My Leave
                      </button>
                    </>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
