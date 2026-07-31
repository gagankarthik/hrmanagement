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
  /** Accepted for call-site compatibility; the console empty state is tone-less. */
  tone?: 'default' | 'brand' | 'emerald' | 'purple' | 'amber' | 'sky';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-6 py-10 text-center',
        className
      )}
    >
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--adm-ink)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-[var(--adm-ink-mute)]">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
