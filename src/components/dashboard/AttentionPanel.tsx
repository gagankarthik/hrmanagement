'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  UserMinus,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { PeopleListModal } from '@/components/dashboard/PeopleListModal';

interface AttentionPanelProps {
  employees: Employee[];
}

type Tone = 'red' | 'amber' | 'yellow' | 'emerald' | 'sky';

interface ActionCategory {
  id: 'expired' | 'expiringSoon' | 'bench' | 'newThisWeek';
  tone: Tone;
  icon: React.ElementType;
  label: string;
  description: string;
  modalTitle: string;
  modalDescription: string;
  people: Employee[];
  contextGetter: (e: Employee) => { primary?: string; secondary?: string };
}

const toneStyles: Record<Tone, { dot: string; iconBg: string; iconColor: string; cta: string }> = {
  red:     { dot: 'bg-red-500',     iconBg: 'bg-red-100',     iconColor: 'text-red-600',     cta: 'text-red-700 group-hover:bg-red-100' },
  amber:   { dot: 'bg-amber-500',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   cta: 'text-amber-700 group-hover:bg-amber-100' },
  yellow:  { dot: 'bg-yellow-400',  iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-700', cta: 'text-yellow-800 group-hover:bg-yellow-100' },
  emerald: { dot: 'bg-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', cta: 'text-emerald-700 group-hover:bg-emerald-100' },
  sky:     { dot: 'bg-sky-500',     iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     cta: 'text-sky-700 group-hover:bg-sky-100' },
};

function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}

export default function AttentionPanel({ employees }: AttentionPanelProps) {
  const [openId, setOpenId] = useState<ActionCategory['id'] | null>(null);

  const categories = useMemo<ActionCategory[]>(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const last7 = new Date(now.getTime() - 7 * 86400000);

    const expired: Employee[] = [];
    const expiringSoon: Employee[] = [];
    const bench: Employee[] = [];
    const newThisWeek: Employee[] = [];

    employees.forEach((e) => {
      const active = isActive(e);
      if (!active) return;

      // Auth expiry
      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (expiry) {
        const d = new Date(expiry);
        if (!Number.isNaN(d.getTime())) {
          if (d < now) expired.push(e);
          else if (d <= in30) expiringSoon.push(e);
        }
      }

      // Bench: no active client OR non-billable
      const hasClient =
        e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
        Boolean(e.clientId || e.client);
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      if (!hasClient || !isBillable) bench.push(e);

      // New hires last 7 days
      if (e.hireDate) {
        const h = new Date(e.hireDate);
        if (!Number.isNaN(h.getTime()) && h >= last7 && h <= now) newThisWeek.push(e);
      }
    });

    // Sort expirations by date ascending (most urgent first)
    const byExpiry = (a: Employee, b: Employee) => {
      const ea = 'expiryDate' in a ? new Date((a as { expiryDate?: string }).expiryDate || 0).getTime() : 0;
      const eb = 'expiryDate' in b ? new Date((b as { expiryDate?: string }).expiryDate || 0).getTime() : 0;
      return ea - eb;
    };
    expired.sort(byExpiry);
    expiringSoon.sort(byExpiry);

    // Sort new-this-week by hire date descending (newest first)
    newThisWeek.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());

    const ctxExpiry = (e: Employee) => {
      const raw = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!raw) return {};
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return {};
      const days = differenceInDays(d, now);
      return {
        primary: format(d, 'MMM d, yyyy'),
        secondary: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`,
      };
    };
    const ctxHire = (e: Employee) => {
      if (!e.hireDate) return {};
      const d = new Date(e.hireDate);
      if (Number.isNaN(d.getTime())) return {};
      const days = differenceInDays(now, d);
      return {
        primary: format(d, 'MMM d, yyyy'),
        secondary: days === 0 ? 'today' : `${days}d ago`,
      };
    };
    const ctxBench = (e: Employee) => {
      const isBillable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      const hasClient =
        e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
        Boolean(e.clientId || e.client);
      return {
        primary: hasClient ? 'Has client' : 'No client',
        secondary: isBillable ? 'Billable' : 'Non-billable',
      };
    };
    return [
      {
        id: 'expired',
        tone: 'red',
        icon: AlertOctagon,
        label: 'auths expired',
        description: 'Work authorizations past their expiry date — renew immediately.',
        modalTitle: 'Authorizations Expired',
        modalDescription: 'These work authorizations have already lapsed. Renew immediately.',
        people: expired,
        contextGetter: ctxExpiry,
      },
      {
        id: 'expiringSoon',
        tone: 'amber',
        icon: AlertTriangle,
        label: 'expire in 30 days',
        description: 'Work authorizations expiring in the next 30 days.',
        modalTitle: 'Expiring in 30 days',
        modalDescription: 'These authorizations need renewal in the next month.',
        people: expiringSoon,
        contextGetter: ctxExpiry,
      },
      {
        id: 'bench',
        tone: 'yellow',
        icon: UserMinus,
        label: 'on bench',
        description: 'Active employees without a client or marked non-billable.',
        modalTitle: 'On Bench',
        modalDescription: 'Active employees without a current client assignment or marked non-billable.',
        people: bench,
        contextGetter: ctxBench,
      },
      {
        id: 'newThisWeek',
        tone: 'emerald',
        icon: Sparkles,
        label: 'new this week',
        description: 'New hires onboarded in the last 7 days.',
        modalTitle: 'New This Week',
        modalDescription: 'New hires onboarded in the last 7 days.',
        people: newThisWeek,
        contextGetter: ctxHire,
      },
    ];
  }, [employees]);

  const visible = categories.filter((c) => c.people.length > 0);
  const openCategory = visible.find((c) => c.id === openId) ?? null;

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">All clear</p>
            <p className="text-xs text-slate-500">No action items right now — your workforce is in good shape.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">Needs your attention</h2>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{visible.length} item{visible.length === 1 ? '' : 's'} · click any row to see who</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {visible.reduce((sum, i) => sum + i.people.length, 0)}
          </span>
        </div>
        <ul className="divide-y divide-slate-100">
          {visible.map((cat) => {
            const s = toneStyles[cat.tone];
            const Icon = cat.icon;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(cat.id)}
                  className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 sm:gap-4 sm:px-5 sm:py-3.5"
                >
                  <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', s.dot)} />
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', s.iconBg)}>
                    <Icon className={cn('h-4 w-4', s.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="tabular-nums">{cat.people.length}</span>{' '}
                      <span className="font-medium text-slate-700">{cat.label}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">{cat.description}</p>
                  </div>
                  <span className={cn('hidden flex-shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:inline-flex', s.cta)}>
                    View
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 sm:hidden" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <PeopleListModal
        isOpen={openCategory !== null}
        onClose={() => setOpenId(null)}
        title={openCategory?.modalTitle ?? ''}
        description={openCategory?.modalDescription}
        people={openCategory?.people ?? []}
        contextGetter={openCategory?.contextGetter}
        icon={openCategory?.icon}
        tone={openCategory?.tone}
        footerLink={openCategory ? { href: '/dashboard/employees', label: 'Open the full employee list' } : undefined}
      />
    </>
  );
}
