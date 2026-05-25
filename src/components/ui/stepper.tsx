'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Step = { label: string; description?: string };

/** Horizontal numbered stepper for multi-step flows (e.g. onboarding wizard). */
export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.label}>
            <li className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                      ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300'
                      : 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="hidden sm:block">
                <span className={cn('block text-sm font-semibold leading-tight', active || done ? 'text-slate-900' : 'text-slate-400')}>
                  {s.label}
                </span>
                {s.description && <span className="block text-xs text-slate-400">{s.description}</span>}
              </span>
            </li>
            {i < steps.length - 1 && <li className="h-px flex-1 bg-slate-200" aria-hidden />}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
