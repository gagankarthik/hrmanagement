import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'emerald' | 'purple' | 'teal' | 'sky' | 'amber' | 'pink' | 'slate';

interface PageHeaderProps {
  /** Accepted for call-site compatibility; the console header renders no icon well. */
  icon?: React.ElementType;
  /** Accepted for call-site compatibility; the console header renders no eyebrow. */
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** Accepted for call-site compatibility; the console header is tone-less. */
  tone?: Tone;
  actions?: React.ReactNode;
  /** When set, renders a left-aligned back link above the title (never in the
      right-hand actions cluster — back always lives on the left). */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Workspace page title — the oceanblue console pattern: an optional back link
 * on its own line, then a plain, bold title with a muted meta line and
 * trailing actions. Deliberately not a band or card; the page content below
 * carries the surfaces.
 */
export function PageHeader(props: PageHeaderProps) {
  const { title, description, actions, backHref, backLabel = 'Back', className } = props;
  return (
    <header className={cn('mb-4', className)}>
      {backHref && (
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> {backLabel}
          </Link>
        </div>
      )}
      {/* Actions align to the TOP right, level with the title, so a two-line
          description never drags them down to the middle of the block. */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.4667rem] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[0.9rem] text-[var(--adm-ink-mute)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
