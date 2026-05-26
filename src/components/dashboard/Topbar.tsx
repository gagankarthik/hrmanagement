'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Menu, Bell, ChevronDown, LogOut,
  UsersRound, Building2, Package, UserRoundCheck, CornerDownLeft, UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { ActivityDrawer } from '@/components/dashboard/ActivityDrawer';

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
  const initials = (user?.name ?? user?.email ?? 'U')
    .split(/[ @]/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const searchRef = useClickOutside<HTMLDivElement>(open, useCallback(() => setOpen(false), []));
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, useCallback(() => setMenuOpen(false), []));

  const q = query.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (!q) return [];
    const out: Result[] = [];
    employees
      .filter((e) => [e.name, e.position, e.personalEmail].some((f) => f?.toLowerCase().includes(q)))
      .slice(0, 5)
      .forEach((e) => out.push({ key: `e-${e.id}`, label: e.name, sub: e.position || e.type, group: 'People', href: `/dashboard/employees/${e.id}`, icon: UsersRound }));
    clients
      .filter((c) => c?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) => out.push({ key: `c-${c.id}`, label: c.name, sub: 'Client', group: 'Clients', href: `/dashboard/clients/${c.id}`, icon: Building2 }));
    vendors
      .filter((v) => v?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((v) => out.push({ key: `v-${v.id}`, label: v.name, sub: 'Vendor', group: 'Vendors', href: `/dashboard/vendors/${v.id}`, icon: Package }));
    subcontractors
      .filter((s) => s?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((s) => out.push({ key: `s-${s.id}`, label: s.name, sub: 'Subcontractor', group: 'Subcontractors', href: `/dashboard/subcontractors/${s.id}`, icon: UserRoundCheck }));
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
    router.push(term ? `/dashboard/employees?q=${encodeURIComponent(term)}` : '/dashboard/employees');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && results[active]) go(results[active].href); else searchAll(); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-5 lg:grid lg:grid-cols-[1fr_minmax(0,28rem)_1fr]">
      {/* Left — mobile menu trigger */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Center — global search */}
      <div ref={searchRef} className="relative w-full max-w-md lg:justify-self-center">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
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
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />

        {open && q && (
          <>
            <div
              role="listbox"
              className="surface absolute left-0 right-0 z-20 mt-2 max-h-[70vh] overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
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

      <div className="ml-auto flex items-center justify-end gap-1.5 sm:gap-2 lg:ml-0">
        {/* Notifications → recent activity side sheet */}
        <button
          onClick={() => setActivityOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Recent activity"
          title="Recent activity"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>

        {/* User dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 transition-colors hover:bg-slate-50"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 sm:block">{name}</span>
            <ChevronDown className={cn('hidden h-4 w-4 text-slate-400 transition-transform sm:block', menuOpen && 'rotate-180')} strokeWidth={1.75} />
          </button>

          {menuOpen && (
            <>
              <div className="surface absolute right-0 z-20 mt-2 w-60 overflow-hidden p-0 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                    {email && <p className="truncate text-xs text-slate-400">{email}</p>}
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setMenuOpen(false); router.push('/dashboard/profile'); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserRound className="h-4 w-4" strokeWidth={1.75} />
                    Profile
                  </button>
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

      <ActivityDrawer open={activityOpen} onClose={() => setActivityOpen(false)} />
    </header>
  );
}
