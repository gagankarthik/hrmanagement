'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types/attendance';

/**
 * Month grid for attendance.
 *
 * Each cell is a whole day rolled up rather than a list of names: at a month's
 * scale the useful question is "which days look wrong", not "who was in on the
 * 14th". Clicking a day answers the second question by switching to day view.
 *
 * Dates are handled as `YYYY-MM-DD` strings throughout. Parsing them into Date
 * objects would shift the day backwards for anyone west of UTC, which is how
 * calendars end up off by one.
 */

export interface DayRollup {
  /** People with a check-in time recorded. */
  clockedIn: number;
  /** Checked in and checked out. */
  clockedOut: number;
  /** Checked in, no check-out yet. */
  stillIn: number;
  /** Marked Absent. */
  absent: number;
  /** Marked Leave. */
  onLeave: number;
  /** Every record for the day, whatever its status. */
  total: number;
}

export function rollUpDay(records: Attendance[]): DayRollup {
  const clockedIn = records.filter((r) => !!r.checkIn).length;
  const clockedOut = records.filter((r) => !!r.checkIn && !!r.checkOut).length;
  return {
    clockedIn,
    clockedOut,
    stillIn: clockedIn - clockedOut,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'Leave').length,
    total: records.length,
  };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** `YYYY-MM-DD` for a given year/month(0-11)/day, built without Date parsing. */
function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function AttendanceCalendar({
  year,
  month,
  records,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  year: number;
  month: number;
  records: Attendance[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const byDate = useMemo(() => {
    const map = new Map<string, Attendance[]>();
    for (const r of records) {
      if (!r.date) continue;
      const list = map.get(r.date);
      if (list) list.push(r);
      else map.set(r.date, [r]);
    }
    return map;
  }, [records]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-first; shift so the grid starts on Monday.
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = new Date();
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h3 className="font-display text-base font-bold text-slate-900">{monthLabel(year, month)}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              onMonthChange(now.getFullYear(), now.getMonth());
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Today
          </button>
          <button
            onClick={() => step(1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-3 sm:p-4">
        <div className="min-w-[560px]">
          <div className="mb-1.5 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[76px] rounded-lg bg-slate-50/50" aria-hidden />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = iso(year, month, day);
              const dayRecords = byDate.get(date) || [];
              const r = rollUpDay(dayRecords);
              const isToday = date === todayIso;
              const isSelected = date === selectedDate;
              const weekend = [5, 6].includes((leadingBlanks + day - 1) % 7);

              return (
                <button
                  key={date}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    'min-h-[76px] rounded-lg border p-1.5 text-left transition-colors',
                    isSelected
                      ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                      : weekend
                      ? 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-50'
                      : 'border-slate-100 bg-white hover:border-brand-200 hover:bg-brand-50/40',
                  )}
                  aria-label={`${date}, ${r.total} record${r.total === 1 ? '' : 's'}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                      isToday ? 'bg-brand-600 text-white' : 'text-slate-500',
                    )}
                  >
                    {day}
                  </span>

                  {r.total > 0 && (
                    <span className="mt-1 flex flex-col gap-0.5">
                      <Pip tone="emerald" label="in" value={r.clockedIn} />
                      {r.stillIn > 0 && <Pip tone="amber" label="still in" value={r.stillIn} />}
                      {r.absent + r.onLeave > 0 && (
                        <Pip tone="slate" label="away" value={r.absent + r.onLeave} />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pip({ tone, label, value }: { tone: 'emerald' | 'amber' | 'slate'; label: string; value: number }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  } as const;
  return (
    <span className={cn('inline-flex w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold', tones[tone])}>
      <span className="tabular-nums">{value}</span>
      <span className="truncate font-medium opacity-80">{label}</span>
    </span>
  );
}
