import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'indigo' | 'emerald' | 'purple' | 'teal' | 'sky' | 'amber' | 'pink' | 'slate';

const toneStyles: Record<Tone, { iconBg: string; iconColor: string; ring: string }> = {
  indigo: { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', ring: 'ring-indigo-100' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', ring: 'ring-emerald-100' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', ring: 'ring-purple-100' },
  teal: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600', ring: 'ring-teal-100' },
  sky: { iconBg: 'bg-sky-100', iconColor: 'text-sky-600', ring: 'ring-sky-100' },
  amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', ring: 'ring-amber-100' },
  pink: { iconBg: 'bg-pink-100', iconColor: 'text-pink-600', ring: 'ring-pink-100' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600', ring: 'ring-slate-100' },
};

interface PageHeaderProps {
  icon?: React.ElementType;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  tone?: Tone;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = 'indigo',
  actions,
  className,
}: PageHeaderProps) {
  const t = toneStyles[tone];
  return (
    <header
      className={cn(
        'surface relative overflow-hidden px-5 py-5 sm:px-6',
        className
      )}
    >
      {/* faint decorative glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)' }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          {Icon && (
            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ring-4 sm:h-12 sm:w-12', t.iconBg, t.ring)}>
              <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', t.iconColor)} />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="font-display text-xl font-bold text-slate-900 sm:text-[1.6rem]">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
