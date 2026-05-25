'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, UsersRound, Building2, Package, UserRoundCheck, CalendarOff, HeartPulse, Inbox,
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

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-600',
  pink: 'bg-pink-50 text-pink-600',
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
      href: `/dashboard/employees/${e.id}`,
      icon: UsersRound, tone: 'brand', time: stamp(e),
    }));

    leaves.forEach((l) => {
      const who = employees.find((e) => e.id === l.employeeId)?.name || 'Employee';
      out.push({
        id: `lv-${l.id}`,
        title: who,
        meta: `Leave ${String(l.status || 'request').toLowerCase()} · ${l.type}`,
        href: `/dashboard/leaves/${l.id}`,
        icon: CalendarOff, tone: 'amber', time: stamp(l),
      });
    });

    clients.forEach((c) => c?.id && out.push({
      id: `cl-${c.id}`, title: c.name || 'Client',
      meta: isNew(c) ? 'Client added' : 'Client updated',
      href: `/dashboard/clients/${c.id}`, icon: Building2, tone: 'emerald', time: stamp(c),
    }));

    vendors.forEach((v) => v?.id && out.push({
      id: `vn-${v.id}`, title: v.name || 'Vendor',
      meta: isNew(v) ? 'Vendor added' : 'Vendor updated',
      href: `/dashboard/vendors/${v.id}`, icon: Package, tone: 'purple', time: stamp(v),
    }));

    subcontractors.forEach((s) => s?.id && out.push({
      id: `sc-${s.id}`, title: s.name || 'Subcontractor',
      meta: isNew(s) ? 'Subcontractor added' : 'Subcontractor updated',
      href: `/dashboard/subcontractors/${s.id}`, icon: UserRoundCheck, tone: 'teal', time: stamp(s),
    }));

    plans.forEach((p) => p?.id && out.push({
      id: `bn-${p.id}`, title: p.name || 'Benefit plan',
      meta: isNew(p) ? 'Benefit plan added' : 'Benefit plan updated',
      href: `/dashboard/benefits/${p.id}`, icon: HeartPulse, tone: 'pink', time: stamp(p),
    }));

    return out.filter((a) => !Number.isNaN(a.time) && a.time > 0).sort((a, b) => b.time - a.time).slice(0, 30);
  }, [employees, leaves, clients, vendors, subcontractors, plans]);

  const go = (href: string) => { onClose(); router.push(href); };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Recent activity"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm transform flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Recent activity</h2>
            <p className="text-xs text-slate-400">{items.length} update{items.length !== 1 ? 's' : ''} across your workspace</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Inbox className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-medium text-slate-600">No recent activity</p>
              <p className="text-xs text-slate-400">Changes across employees, leaves and partners will show up here.</p>
            </div>
          ) : (
            items.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => go(a.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClasses[a.tone] || toneClasses.brand)}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{a.title}</span>
                    <span className="block truncate text-xs text-slate-400">{a.meta}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(a.time)}</span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
