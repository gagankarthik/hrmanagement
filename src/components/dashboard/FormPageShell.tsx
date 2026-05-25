'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'emerald' | 'purple' | 'teal' | 'sky' | 'amber' | 'pink' | 'slate';

/**
 * Consistent scaffold for routed create / edit / detail-form pages:
 * a back link, the standard PageHeader, and a centered content column.
 * Render the form card(s) as children.
 */
export function FormPageShell({
  icon,
  eyebrow,
  title,
  description,
  tone = 'brand',
  actions,
  backHref,
  backLabel = 'Back',
  maxWidth = 'max-w-3xl',
  children,
}: {
  icon?: React.ElementType;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  tone?: Tone;
  actions?: React.ReactNode;
  backHref: string;
  backLabel?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full space-y-5', maxWidth)}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> {backLabel}
      </Link>
      <PageHeader icon={icon} eyebrow={eyebrow} title={title} description={description} tone={tone} actions={actions} />
      {children}
    </div>
  );
}
