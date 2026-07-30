import * as React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusBadge — the one pill used for entity status everywhere (Active /
 * Inactive / Terminated / Pending …). Replaces the hand-rolled coloured spans
 * duplicated across the list and detail pages.
 */
export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const tones: Record<StatusTone, { cls: string; dot: string; Icon: React.ElementType }> = {
  success: { cls: 'bg-[var(--adm-success-soft)] text-[var(--adm-success)]', dot: 'bg-emerald-500', Icon: CheckCircle2 },
  danger: { cls: 'bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]', dot: 'bg-rose-500', Icon: XCircle },
  warning: { cls: 'bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]', dot: 'bg-amber-500', Icon: AlertTriangle },
  info: { cls: 'bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]', dot: 'bg-[var(--adm-accent)]', Icon: Circle },
  neutral: { cls: 'bg-[var(--adm-surface-sunken)] text-[var(--adm-ink-mute)]', dot: 'bg-slate-400', Icon: Circle },
};

export function StatusBadge({
  label,
  tone = 'neutral',
  icon,
  showIcon = true,
  className,
}: {
  label: string;
  tone?: StatusTone;
  icon?: React.ElementType;
  showIcon?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  const Icon = icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.03em]',
        t.cls,
        className,
      )}
    >
      {showIcon && (Icon
        ? <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
        : <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} aria-hidden />)}
      {label}
    </span>
  );
}

/** Map a common Active/Inactive/Terminated value to a tone. */
export function statusTone(value?: string): StatusTone {
  switch ((value || '').toLowerCase()) {
    case 'active':
      return 'success';
    case 'terminated':
    case 'inactive':
      return 'danger';
    case 'pending':
    case 'on leave':
      return 'warning';
    default:
      return 'neutral';
  }
}
