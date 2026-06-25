import React from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Leave } from '@/types/leave';
import { startOfDay, firstName, typeBadge } from './shared';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS_PER_DAY = 3;

export function CalendarPanel({
  month,
  onMonthChange,
  cells,
  mobileGroups,
  nameOf,
  onChipClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  cells: { date: Date | null; leaves: Leave[] }[];
  mobileGroups: { date: Date | null; leaves: Leave[] }[];
  nameOf: (id: string) => string;
  onChipClick: (id: string) => void;
}) {
  const today = startOfDay(new Date());
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const Chip = ({ leave }: { leave: Leave }) => (
    <button
      onClick={() => onChipClick(leave.id)}
      title={`${nameOf(leave.employeeId)} · ${leave.type}`}
      className={cn(
        'block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition-opacity hover:opacity-80',
        typeBadge[leave.type]
      )}
    >
      {firstName(nameOf(leave.employeeId))}
    </button>
  );

  return (
    <div className="surface overflow-hidden">
      {/* Calendar toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop / tablet: 7-column grid */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.date && startOfDay(cell.date).getTime() === today.getTime();
            const visible = cell.leaves.slice(0, MAX_CHIPS_PER_DAY);
            const extra = cell.leaves.length - visible.length;
            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[92px] border-b border-r border-slate-100 p-1.5 last-of-type:border-r-0',
                  !cell.date && 'bg-slate-50/40',
                  (idx + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                {cell.date && (
                  <>
                    <div className="mb-1 flex justify-end">
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                          isToday ? 'bg-brand-600 text-white' : 'text-slate-500'
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {visible.map((leave) => (
                        <Chip key={leave.id} leave={leave} />
                      ))}
                      {extra > 0 && (
                        <p className="px-1 text-[10px] font-medium text-slate-400">+{extra} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical list grouped by day */}
      <div className="sm:hidden">
        {mobileGroups.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarRange}
              tone="brand"
              title="No approved leave this month"
              description="Approved leaves for this month will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mobileGroups.map((cell, idx) => {
              const d = cell.date!;
              const isToday = startOfDay(d).getTime() === today.getTime();
              return (
                <li key={idx} className="px-5 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                        isToday ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cell.leaves.map((leave) => (
                      <button
                        key={leave.id}
                        onClick={() => onChipClick(leave.id)}
                        className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80', typeBadge[leave.type])}
                      >
                        {firstName(nameOf(leave.employeeId))} · {leave.type}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">Showing approved leaves · click a chip to open the request</p>
      </div>
    </div>
  );
}
