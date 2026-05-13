'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { UserPlus, RefreshCw, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { EmptyState } from '@/components/ui/empty-state';

interface RecentActivityProps {
  employees: Employee[];
  limit?: number;
}

interface ActivityEntry {
  id: string;
  type: 'created' | 'updated';
  employee: Employee;
  timestamp: Date;
}

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

const typeColor: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

export default function RecentActivity({ employees, limit = 8 }: RecentActivityProps) {
  const entries = useMemo<ActivityEntry[]>(() => {
    const out: ActivityEntry[] = [];
    employees.forEach((e) => {
      if (e.createdAt) {
        const c = new Date(e.createdAt);
        if (!Number.isNaN(c.getTime())) {
          out.push({ id: `${e.id}:created`, type: 'created', employee: e, timestamp: c });
        }
      }
      if (e.updatedAt && e.updatedAt !== e.createdAt) {
        const u = new Date(e.updatedAt);
        if (!Number.isNaN(u.getTime())) {
          out.push({ id: `${e.id}:updated`, type: 'updated', employee: e, timestamp: u });
        }
      }
    });
    return out
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [employees, limit]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
        </div>
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {entries.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Activity}
            tone="indigo"
            title="No recent activity"
            description="As you onboard or update employees they'll show up here."
          />
        </div>
      ) : (
        <ol className="divide-y divide-slate-100">
          {entries.map((entry) => {
            const Icon = entry.type === 'created' ? UserPlus : RefreshCw;
            const tone = entry.type === 'created'
              ? { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', verb: 'onboarded' }
              : { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', verb: 'updated' };

            return (
              <li key={entry.id}>
                <Link
                  href={`/dashboard/employees/${entry.employee.id}`}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60"
                >
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', tone.iconBg)}>
                    <Icon className={cn('h-4 w-4', tone.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{entry.employee.name}</span>
                      <span className="text-slate-500"> was {tone.verb}</span>
                      {entry.employee.position && (
                        <span className="text-slate-500"> — {entry.employee.position}</span>
                      )}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0 text-[10px] font-semibold',
                          typeColor[entry.employee.type] || 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {entry.employee.type}
                      </span>
                      <span>·</span>
                      <span>{timeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
