import * as React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusBadge — the one pill used for entity status everywhere (Active /
 * Inactive / Terminated / Pending …). Replaces the hand-rolled coloured spans
 * duplicated across the list and detail pages.
 */
export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const tones: Record<StatusTone, { cls: string; Icon: React.ElementType }> = {
  success: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircle2 },
  danger: { cls: 'bg-red-50 text-red-600 ring-red-200', Icon: XCircle },
  warning: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: AlertTriangle },
  info: { cls: 'bg-brand-50 text-brand-700 ring-brand-200', Icon: Circle },
  neutral: { cls: 'bg-slate-100 text-slate-600 ring-slate-200', Icon: Circle },
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
  const Icon = icon ?? t.Icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        t.cls,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />}
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
