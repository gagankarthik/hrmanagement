import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'emerald' | 'purple' | 'teal' | 'sky' | 'amber' | 'pink' | 'slate';

const toneStyles: Record<Tone, { iconBg: string; iconColor: string; ring: string }> = {
  brand: { iconBg: 'bg-brand-100', iconColor: 'text-brand-600', ring: 'ring-brand-100' },
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
  tone = 'brand',
  actions,
  className,
}: PageHeaderProps) {
  const t = toneStyles[tone];
  return (
    <header
      className={cn(
        'surface relative overflow-hidden px-4 py-3.5 sm:px-5 sm:py-4',
        className
      )}
    >
      {/* faint decorative glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(16,61,51,0.10), transparent 70%)' }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-4 sm:h-11 sm:w-11', t.iconBg, t.ring)}>
              <Icon className={cn('h-5 w-5', t.iconColor)} />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
            <h1 className="font-display text-lg font-bold text-slate-900 sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
