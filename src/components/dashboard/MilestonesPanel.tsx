'use client';

import React, { useMemo, useState } from 'react';
import { Cake, Award, ChevronRight, Users } from 'lucide-react';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { PeopleListModal } from '@/components/dashboard/PeopleListModal';

interface MilestonesPanelProps {
  employees: Employee[];
  /** Look-ahead window in days (default 30) */
  windowDays?: number;
}

function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}

export default function MilestonesPanel({ employees, windowDays = 30 }: MilestonesPanelProps) {
  const [open, setOpen] = useState<'birthdays' | 'anniversaries' | null>(null);

  const { birthdays, anniversaries } = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + windowDays * 86400000);

    const bdays: Employee[] = [];
    const annivs: Employee[] = [];

    employees.forEach((e) => {
      if (!isActive(e)) return;

      if (e.dob) {
        const d = new Date(e.dob);
        if (!Number.isNaN(d.getTime())) {
          const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
          if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
          if (thisYear <= horizon) bdays.push(e);
        }
      }

      if (e.hireDate) {
        const d = new Date(e.hireDate);
        if (!Number.isNaN(d.getTime())) {
          const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
          if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
          const years = thisYear.getFullYear() - d.getFullYear();
          if (years >= 1 && thisYear <= horizon) annivs.push(e);
        }
      }
    });

    const byBirthday = (a: Employee, b: Employee) => {
      const da = new Date(a.dob!), db = new Date(b.dob!);
      const ya = new Date(now.getFullYear(), da.getMonth(), da.getDate());
      const yb = new Date(now.getFullYear(), db.getMonth(), db.getDate());
      if (ya < now) ya.setFullYear(now.getFullYear() + 1);
      if (yb < now) yb.setFullYear(now.getFullYear() + 1);
      return ya.getTime() - yb.getTime();
    };
    const byAnniversary = (a: Employee, b: Employee) => {
      const da = new Date(a.hireDate), db = new Date(b.hireDate);
      const ya = new Date(now.getFullYear(), da.getMonth(), da.getDate());
      const yb = new Date(now.getFullYear(), db.getMonth(), db.getDate());
      if (ya < now) ya.setFullYear(now.getFullYear() + 1);
      if (yb < now) yb.setFullYear(now.getFullYear() + 1);
      return ya.getTime() - yb.getTime();
    };
    bdays.sort(byBirthday);
    annivs.sort(byAnniversary);

    return { birthdays: bdays, anniversaries: annivs };
  }, [employees, windowDays]);

  const ctxBirthday = (e: Employee) => {
    if (!e.dob) return {};
    const now = new Date();
    const d = new Date(e.dob);
    if (Number.isNaN(d.getTime())) return {};
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
    const days = differenceInDays(thisYear, now);
    const turningAge = thisYear.getFullYear() - d.getFullYear();
    return {
      primary: format(thisYear, 'MMM d'),
      secondary: days === 0 ? `Turning ${turningAge} today` : `Turning ${turningAge} · in ${days}d`,
    };
  };

  const ctxAnniversary = (e: Employee) => {
    if (!e.hireDate) return {};
    const now = new Date();
    const d = new Date(e.hireDate);
    if (Number.isNaN(d.getTime())) return {};
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
    const days = differenceInDays(thisYear, now);
    const years = thisYear.getFullYear() - d.getFullYear();
    return {
      primary: format(thisYear, 'MMM d'),
      secondary: days === 0 ? `${years}-year anniversary today` : `${years} years · in ${days}d`,
    };
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <MilestoneCard
          tone="pink"
          icon={Cake}
          title="Upcoming Birthdays"
          subtitle={`Next ${windowDays} days`}
          people={birthdays}
          dateGetter={(e) => e.dob}
          onOpen={() => setOpen('birthdays')}
        />
        <MilestoneCard
          tone="emerald"
          icon={Award}
          title="Work Anniversaries"
          subtitle={`Next ${windowDays} days`}
          people={anniversaries}
          dateGetter={(e) => e.hireDate}
          showYears
          onOpen={() => setOpen('anniversaries')}
        />
      </div>

      <PeopleListModal
        isOpen={open === 'birthdays'}
        onClose={() => setOpen(null)}
        title="Upcoming Birthdays"
        description={`Birthdays falling within the next ${windowDays} days.`}
        people={birthdays}
        contextGetter={ctxBirthday}
        icon={Cake}
        tone="pink"
      />
      <PeopleListModal
        isOpen={open === 'anniversaries'}
        onClose={() => setOpen(null)}
        title="Work Anniversaries"
        description={`Work anniversaries falling within the next ${windowDays} days.`}
        people={anniversaries}
        contextGetter={ctxAnniversary}
        icon={Award}
        tone="emerald"
      />
    </>
  );
}

interface MilestoneCardProps {
  tone: 'pink' | 'emerald';
  icon: React.ElementType;
  title: string;
  subtitle: string;
  people: Employee[];
  dateGetter: (e: Employee) => string | undefined;
  showYears?: boolean;
  onOpen: () => void;
}

const cardTone = {
  pink:    { iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',    chip: 'bg-pink-50 text-pink-700 ring-pink-200',       avatar: 'from-pink-400 to-rose-500' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', avatar: 'from-emerald-400 to-teal-500' },
};

function MilestoneCard({ tone, icon: Icon, title, subtitle, people, dateGetter, showYears, onOpen }: MilestoneCardProps) {
  const t = cardTone[tone];
  const preview = people.slice(0, 3);
  const overflow = people.length - preview.length;
  const now = new Date();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.iconBg)}>
            <Icon className={cn('h-4 w-4', t.iconColor)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">{subtitle}</p>
          </div>
        </div>
        <span className={cn('flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', t.chip)}>
          {people.length}
        </span>
      </div>

      <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', t.iconBg)}>
              <Icon className={cn('h-5 w-5', t.iconColor)} />
            </div>
            <p className="text-xs text-slate-400">None coming up in the next 30 days</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {preview.map((p) => {
              const raw = dateGetter(p);
              const d = raw ? new Date(raw) : null;
              const valid = d && !Number.isNaN(d.getTime());
              const thisYear = valid && d ? new Date(now.getFullYear(), d.getMonth(), d.getDate()) : null;
              if (thisYear && thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
              const dateLabel = thisYear ? format(thisYear, 'MMM d') : '—';
              const days = thisYear ? differenceInDays(thisYear, now) : null;
              const years = showYears && valid && d ? differenceInYears(now, d) + (thisYear && thisYear.getFullYear() > now.getFullYear() ? 1 : 0) : null;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white', t.avatar)}>
                    {p.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                      {p.position || '—'}
                      {years !== null && <span className="text-slate-400"> · {years}y</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold tabular-nums text-slate-900">{dateLabel}</p>
                    {days !== null && (
                      <p className="text-[10px] text-slate-400">
                        {days === 0 ? 'today' : `in ${days}d`}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {people.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs sm:px-5">
          <span className="text-slate-500">
            {overflow > 0 ? `+${overflow} more` : 'Click to see everyone'}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
            <Users className="h-3.5 w-3.5" />
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </button>
  );
}
