'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { Network, Plus, ChevronDown, Building2, Target, Package, UserRoundCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/PageHeader';
import ClientsList from '@/components/dashboard/partners/ClientsList';
import EndClientsList from '@/components/dashboard/partners/EndClientsList';
import VendorsList from '@/components/dashboard/partners/VendorsList';
import SubcontractorsList from '@/components/dashboard/partners/SubcontractorsList';

type TabId = 'clients' | 'endclients' | 'vendors' | 'subcontractors';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'clients', label: 'Clients', icon: Building2 },
  { id: 'endclients', label: 'End Clients', icon: Target },
  { id: 'vendors', label: 'Vendors', icon: Package },
  { id: 'subcontractors', label: 'Subcontractors', icon: UserRoundCheck },
];

const ADD_OPTIONS: { label: string; href: string; icon: React.ElementType }[] = [
  { label: 'Add Client', href: '/dashboard/clients/new', icon: Building2 },
  { label: 'Add End Client', href: '/dashboard/endclients/new', icon: Target },
  { label: 'Add Vendor', href: '/dashboard/vendors/new', icon: Package },
  { label: 'Add Subcontractor', href: '/dashboard/subcontractors/new', icon: UserRoundCheck },
];

const MENU_WIDTH = 224;

/**
 * Add-partner dropdown. Renders the menu in a portal so it isn't clipped by the
 * PageHeader's `overflow-hidden`.
 */
function AddPartnerMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const position = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: Math.max(8, r.right - MENU_WIDTH) });
  }, []);

  useEffect(() => {
    if (!open) return;
    position();
    const onScroll = () => position();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', position);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, position]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-primary"
      >
        <Plus className="h-4 w-4" /> Add partner
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />
      </button>

      {mounted && open && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="surface fixed z-[61] overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">New partner</p>
            {ADD_OPTIONS.map((o) => (
              <button
                key={o.href}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); router.push(o.href); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <o.icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                {o.label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

function PartnersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramTab = searchParams.get('tab') as TabId | null;
  const initial: TabId = TABS.some((t) => t.id === paramTab) ? (paramTab as TabId) : 'clients';
  const [tab, setTab] = useState<TabId>(initial);

  const selectTab = (id: TabId) => {
    setTab(id);
    // Keep the URL in sync (shareable / refresh-safe) without a full navigation.
    router.replace(`/dashboard/partners?tab=${id}`, { scroll: false });
  };

  return (
    <PageContainer>
      <PageHeader
        icon={Network}
        eyebrow="Network"
        title="Partners"
        description="Clients, end clients, vendors, and subcontractors — all in one place."
        tone="brand"
        actions={<AddPartnerMenu />}
      />

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max items-center gap-1" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={cn(
                  'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {t.label}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-brand-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active list (header-less embedded view) */}
      {tab === 'clients' && <ClientsList embedded />}
      {tab === 'endclients' && <EndClientsList embedded />}
      {tab === 'vendors' && <VendorsList embedded />}
      {tab === 'subcontractors' && <SubcontractorsList embedded />}

      {/* View all → dedicated full page for the active tab */}
      <div className="flex justify-center pt-1">
        <Link
          href={`/dashboard/${tab}`}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          View all {TABS.find((t) => t.id === tab)?.label.toLowerCase()}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
        </Link>
      </div>
    </PageContainer>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={null}>
      <PartnersContent />
    </Suspense>
  );
}
