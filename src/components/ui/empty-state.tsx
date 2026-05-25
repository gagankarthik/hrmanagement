import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  tone?: 'default' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'sky';
}

const tones: Record<NonNullable<EmptyStateProps['tone']>, { iconBg: string; iconColor: string }> = {
  default: { iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
  indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  emerald: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  purple: { iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  sky: { iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  tone = 'default',
}: EmptyStateProps) {
  const t = tones[tone];
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-14 text-center',
        className
      )}
    >
      <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-4 ring-white', t.iconBg)}>
        <Icon className={cn('h-7 w-7', t.iconColor)} />
      </div>
      <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
