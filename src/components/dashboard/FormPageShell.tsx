'use client';

import React from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'emerald' | 'purple' | 'teal' | 'sky' | 'amber' | 'pink' | 'slate';

/**
 * Consistent scaffold for routed create / edit / detail-form pages:
 * the standard PageHeader (with its left-aligned back link) and a content
 * column. Render the form card(s) as children.
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
    <div className={cn('w-full space-y-5', maxWidth)}>
      <PageHeader
        icon={icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
        tone={tone}
        actions={actions}
        backHref={backHref}
        backLabel={backLabel}
      />
      {children}
    </div>
  );
}
