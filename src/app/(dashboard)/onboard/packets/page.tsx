'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck, UserPlus, Check, CheckCheck, ChevronDown, Loader2, CheckCircle2, Clock, Users,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { FilterSelect } from '@/components/ui/filter-select';
import { useToast } from '@/components/ui/toast';
import { useEmployees } from '@/context/EmployeeContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { friendlyError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_CATEGORIES, buildDefaultItems, reconcileItems, packetProgress,
  type OnboardingItem,
} from '@/types/onboarding';
import type { Employee } from '@/types/employee';

const RECENT_WINDOW_DAYS = 120;

/** What the list is for: the people still owed something. "All" keeps the finished ones in view. */
type Scope = 'pending' | 'all';
const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'pending', label: 'Not completed' },
  { value: 'all', label: 'Everyone' },
];

export default function OnboardingPacketsPage() {
  const router = useRouter();
  const toast = useToast();
  const { employees, isLoading: empLoading } = useEmployees();
  const { packets, isLoading: pkLoading, getByEmployee, savePacket } = useOnboarding();

  // Local working copies keyed by employeeId; seeded from the saved packet (or a
  // fresh template) the first time a packet is touched.
  const [drafts, setDrafts] = useState<Record<string, OnboardingItem[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [scope, setScope] = useState<Scope>('pending');

  const isLoading = empLoading && pkLoading && employees.length === 0 && packets.length === 0;

  // Onboarding subjects: every current employee, newest hire first. It used to
  // be a 120-day window, which hid everyone onboarded before this system
  // existed — and those are exactly the packets HR still needs to close out.
  // Terminated staff drop off; they are nobody's outstanding work.
  const subjects = useMemo(
    () =>
      employees
        .filter((e) => e?.id && e.status !== 'Terminated')
        .sort((a, b) => (b.hireDate || '').localeCompare(a.hireDate || '')),
    [employees],
  );

  /** Hired inside the recent window — what the "new hires" stat counts. */
  const recentCount = useMemo(() => {
    const cutoff = Date.now() - RECENT_WINDOW_DAYS * 86400000;
    return subjects.filter((e) => {
      const t = e.hireDate ? new Date(e.hireDate).getTime() : NaN;
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }, [subjects]);

  const itemsFor = (e: Employee): OnboardingItem[] => {
    if (drafts[e.id]) return drafts[e.id];
    const saved = getByEmployee(e.id);
    return saved ? reconcileItems(saved.items) : buildDefaultItems();
  };

  // Aggregate stats
  const stats = useMemo(() => {
    let inProgress = 0, complete = 0, pctSum = 0;
    subjects.forEach((e) => {
      const { pct } = packetProgress(itemsFor(e));
      pctSum += pct;
      if (pct >= 100) complete += 1;
      else if (pct > 0) inProgress += 1;
    });
    return {
      total: subjects.length,
      inProgress,
      complete,
      avg: subjects.length ? Math.round(pctSum / subjects.length) : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, drafts, packets]);

  // The default view is the work still outstanding; completed packets stay one
  // switch away rather than padding the list.
  const visible = useMemo(
    () => (scope === 'all' ? subjects : subjects.filter((e) => packetProgress(itemsFor(e)).pct < 100)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjects, scope, drafts, packets],
  );
  const hiddenComplete = subjects.length - visible.length;

  const toggleItem = async (e: Employee, key: string) => {
    const current = itemsFor(e);
    const now = new Date().toISOString();
    const next = current.map((it) =>
      it.key === key ? { ...it, done: !it.done, doneAt: !it.done ? now : undefined } : it,
    );
    setDrafts((d) => ({ ...d, [e.id]: next }));
    setSavingId(e.id);
    try {
      await savePacket({
        employeeId: e.id,
        employeeName: e.name || 'New hire',
        employeeType: e.type,
        startDate: e.hireDate,
        items: next,
      });
    } catch (err) {
      // Revert on failure.
      setDrafts((d) => ({ ...d, [e.id]: current }));
      toast.error('Could not save', friendlyError(err));
    } finally {
      setSavingId(null);
    }
  };

  /** Tick every remaining item for one person in a single save. */
  const completeAll = async (e: Employee) => {
    const current = itemsFor(e);
    const now = new Date().toISOString();
    const remaining = current.filter((it) => !it.done).length;
    if (remaining === 0) return;
    const next = current.map((it) => (it.done ? it : { ...it, done: true, doneAt: now }));

    setDrafts((d) => ({ ...d, [e.id]: next }));
    setSavingId(e.id);
    try {
      await savePacket({
        employeeId: e.id,
        employeeName: e.name || 'New hire',
        employeeType: e.type,
        startDate: e.hireDate,
        items: next,
      });
      toast.success(
        'Onboarding complete',
        `${e.name || 'New hire'} — ${remaining} remaining item${remaining !== 1 ? 's' : ''} ticked off.`,
      );
    } catch (err) {
      setDrafts((d) => ({ ...d, [e.id]: current }));
      toast.error('Could not save', friendlyError(err));
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={2} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={ClipboardCheck}
        eyebrow="People"
        title="New-hire onboarding"
        description="Everyone on the team gets a packet. Tick items off as they’re completed, or mark a whole packet done for people onboarded before this system."
        tone="brand"
        actions={
          <button onClick={() => router.push('/onboard')} className="btn-primary">
            <UserPlus className="h-4 w-4" /> Add new hire
          </button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="People" value={stats.total} icon={Users} tone="brand" hint={`${recentCount} hired in last ${RECENT_WINDOW_DAYS} days`} />
        <StatCard label="In progress" value={stats.inProgress} icon={Clock} tone="amber" hint="started, not finished" />
        <StatCard label="Completed" value={stats.complete} icon={CheckCircle2} tone="emerald" hint="fully onboarded" />
        <StatCard label="Avg. completion" value={`${stats.avg}%`} icon={ClipboardCheck} tone="slate" hint="across all packets" />
      </StatGrid>

      {/* Scope — the outstanding work by default, everyone on request. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {scope === 'pending'
            ? `${visible.length} packet${visible.length !== 1 ? 's' : ''} still open`
            : `${visible.length} packet${visible.length !== 1 ? 's' : ''} in total`}
          {scope === 'pending' && hiddenComplete > 0 && (
            <span className="text-slate-400"> · {hiddenComplete} completed hidden</span>
          )}
        </p>
        <FilterSelect label="Show" value={scope} onChange={setScope} options={SCOPE_OPTIONS} />
      </div>

      {visible.length === 0 ? (
        <div className="surface p-5">
          <EmptyState
            icon={ClipboardCheck}
            tone="brand"
            title={
              subjects.length === 0
                ? 'No one to onboard right now'
                : 'Everyone is fully onboarded'
            }
            description={
              subjects.length === 0
                ? 'New hires appear here automatically. Add someone to start their onboarding packet.'
                : 'No packets are outstanding. Switch to Everyone to review completed ones.'
            }
            action={
              subjects.length === 0 ? (
                <button onClick={() => router.push('/onboard')} className="btn-primary">
                  <UserPlus className="h-4 w-4" /> Add new hire
                </button>
              ) : (
                <button onClick={() => setScope('all')} className="btn-ghost">
                  Show everyone
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((e) => {
            const items = itemsFor(e);
            const { done, total, pct } = packetProgress(items);
            const open = expanded[e.id] ?? (pct > 0 && pct < 100); // in-progress open by default
            const complete = pct >= 100;
            const initials = (e.name || 'NH').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div key={e.id} className="surface overflow-hidden">
                {/* Header (click to expand) */}
                <button
                  type="button"
                  onClick={() => setExpanded((x) => ({ ...x, [e.id]: !open }))}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
                >
                  <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold',
                    complete ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700',
                  )}>
                    {complete ? <Check className="h-5 w-5" strokeWidth={2.5} /> : initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-base font-bold text-slate-900">{e.name || 'New hire'}</p>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{e.type}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {e.position ? `${e.position} · ` : ''}Started {formatDate(e.hireDate)}
                    </p>
                  </div>
                  {/* Progress */}
                  <div className="hidden w-40 shrink-0 sm:block">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">{done}/{total}</span>
                      <span className={cn('font-bold tabular-nums', complete ? 'text-emerald-600' : 'text-brand-700')}>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full rounded-full transition-all', complete ? 'bg-emerald-500' : 'bg-brand-600')} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                  {savingId === e.id
                    ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    : <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />}
                </button>

                {/* Checklist */}
                {open && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {!complete && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-slate-50 px-3.5 py-2.5">
                        <p className="text-xs text-slate-500">
                          {total - done} item{total - done !== 1 ? 's' : ''} left for {e.name?.split(' ')[0] || 'this hire'}
                        </p>
                        <button
                          type="button"
                          onClick={() => completeAll(e)}
                          disabled={savingId === e.id}
                          className="btn-ghost h-8 px-2.5 text-xs disabled:opacity-50"
                        >
                          {savingId === e.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCheck className="h-3.5 w-3.5" />}
                          Mark all complete
                        </button>
                      </div>
                    )}
                    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      {ONBOARDING_CATEGORIES.map((cat) => {
                        const catItems = items.filter((i) => i.category === cat);
                        if (catItems.length === 0) return null;
                        return (
                          <div key={cat}>
                            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-700">{cat}</h4>
                            <ul className="space-y-1">
                              {catItems.map((it) => (
                                <li key={it.key}>
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={it.done}
                                    onClick={() => toggleItem(e, it.key)}
                                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                                  >
                                    <span className={cn(
                                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                                      it.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white group-hover:border-brand-400',
                                    )}>
                                      {it.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                    </span>
                                    <span className={cn('text-sm', it.done ? 'text-slate-400 line-through' : 'font-medium text-slate-700')}>
                                      {it.label}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
