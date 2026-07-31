'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  UsersRound, Building2, Package, UserRoundCheck, CalendarOff, HeartPulse, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';
import { useLeaves } from '@/context/LeaveContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { useSubcontractors } from '@/context/SubcontractorContext';
import { useBenefits } from '@/context/BenefitsContext';

type Activity = {
  id: string;
  title: string;
  meta: string;
  href: string;
  icon: React.ElementType;
  tone: string;
  time: number;
};

// Translucent tone wells, matching the company console's notification rows.
const toneClasses: Record<string, string> = {
  brand: 'bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]',
  emerald: 'bg-emerald-500/15 text-emerald-600',
  purple: 'bg-violet-500/15 text-violet-500',
  teal: 'bg-teal-500/15 text-teal-600',
  amber: 'bg-amber-500/15 text-amber-600',
  pink: 'bg-pink-500/15 text-pink-600',
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (Number.isNaN(diff)) return '';
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const stamp = (i: { updatedAt?: string; createdAt?: string }) =>
  Date.parse(i.updatedAt || i.createdAt || '');
const isNew = (i: { updatedAt?: string; createdAt?: string }) =>
  !i.updatedAt || i.updatedAt === i.createdAt;

export function ActivityDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { employees } = useEmployees();
  const { leaves } = useLeaves();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { subcontractors } = useSubcontractors();
  const { plans } = useBenefits();

  const items = useMemo<Activity[]>(() => {
    const out: Activity[] = [];

    employees.forEach((e) => out.push({
      id: `emp-${e.id}`,
      title: e.name || 'Employee',
      meta: isNew(e) ? `${e.type} employee added` : `${e.type} employee updated`,
      href: `/employees/${e.id}`,
      icon: UsersRound, tone: 'brand', time: stamp(e),
    }));

    leaves.forEach((l) => {
      const who = employees.find((e) => e.id === l.employeeId)?.name || 'Employee';
      out.push({
        id: `lv-${l.id}`,
        title: who,
        meta: `Leave ${String(l.status || 'request').toLowerCase()} · ${l.type}`,
        href: `/leaves/${l.id}`,
        icon: CalendarOff, tone: 'amber', time: stamp(l),
      });
    });

    clients.forEach((c) => c?.id && out.push({
      id: `cl-${c.id}`, title: c.name || 'Client',
      meta: isNew(c) ? 'Client added' : 'Client updated',
      href: `/clients/${c.id}`, icon: Building2, tone: 'emerald', time: stamp(c),
    }));

    vendors.forEach((v) => v?.id && out.push({
      id: `vn-${v.id}`, title: v.name || 'Vendor',
      meta: isNew(v) ? 'Vendor added' : 'Vendor updated',
      href: `/vendors/${v.id}`, icon: Package, tone: 'purple', time: stamp(v),
    }));

    subcontractors.forEach((s) => s?.id && out.push({
      id: `sc-${s.id}`, title: s.name || 'Subcontractor',
      meta: isNew(s) ? 'Subcontractor added' : 'Subcontractor updated',
      href: `/subcontractors/${s.id}`, icon: UserRoundCheck, tone: 'teal', time: stamp(s),
    }));

    plans.forEach((p) => p?.id && out.push({
      id: `bn-${p.id}`, title: p.name || 'Benefit plan',
      meta: isNew(p) ? 'Benefit plan added' : 'Benefit plan updated',
      href: `/benefits/${p.id}`, icon: HeartPulse, tone: 'pink', time: stamp(p),
    }));

    return out.filter((a) => !Number.isNaN(a.time) && a.time > 0).sort((a, b) => b.time - a.time).slice(0, 30);
  }, [employees, leaves, clients, vendors, subcontractors, plans]);

  const go = (href: string) => { onClose(); router.push(href); };

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Anchored dropdown panel (the console pattern) — expects a `relative`
  // wrapper around the bell button; click-outside dismissal lives there.
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-1.5 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-white shadow-[var(--adm-shadow-pop)] animate-in fade-in slide-in-from-top-1 duration-150 sm:w-96"
    >
      <header className="flex items-center justify-between border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3">
        <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">Notifications</h2>
        <span className="rounded-full bg-[var(--adm-surface-2)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
          {items.length}
        </span>
      </header>

      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
              <Inbox className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <p className="text-[14px] font-semibold text-[var(--adm-ink)]">No recent activity</p>
            <p className="text-xs text-[var(--adm-ink-mute)]">Changes across employees, leaves and partners will show up here.</p>
          </div>
        ) : (
          items.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => go(a.href)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--adm-row-hover)]',
                  i > 0 && 'border-t border-[var(--adm-line-soft)]',
                )}
              >
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]', toneClasses[a.tone] || toneClasses.brand)}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[var(--adm-ink)]">{a.title}</span>
                  <span className="block truncate text-[12px] text-[var(--adm-ink-mute)]">{a.meta}</span>
                </span>
                <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-[var(--adm-ink-subtle)]">{timeAgo(a.time)}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
