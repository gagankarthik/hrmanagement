'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, Bell, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const name = user?.name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';
  const initials = (user?.name ?? user?.email ?? 'U')
    .split(/[ @]/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/employees?q=${encodeURIComponent(q)}` : '/dashboard/employees');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-5">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <form onSubmit={submitSearch} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees…"
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Notifications (decorative placeholder) */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User dropdown */}
        <div className="relative">
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
            <ChevronDown className={cn('hidden h-4 w-4 text-slate-400 transition-transform sm:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
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
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
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
