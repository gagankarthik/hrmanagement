'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Back navigation that remembers where the user came from. Partner records are
 * reachable from two places — the Partners hub (the usual route) and the
 * standalone list page. Lists stamp `?from=partners` or `?from=list` on the link
 * they open, so "back" lands where the user actually was. Anything else
 * (deep link, refresh) falls back to the Partners tab.
 */
export type PartnersTab = 'clients' | 'endclients' | 'vendors' | 'subcontractors';

export interface BackLinkProps {
  /** The standalone list page, e.g. `/vendors`. */
  href: string;
  /** Label for the standalone list, e.g. "Back to Vendors". */
  label: string;
  /** Partners tab this record belongs to — the default destination. */
  partnersTab?: PartnersTab;
  className?: string;
}

const BASE_CLASS =
  'inline-flex items-center gap-2 rounded-[8px] border border-transparent px-2.5 py-1.5 text-[13px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-line)] hover:bg-white hover:text-[var(--adm-ink)]';

function Anchor({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={className ?? BASE_CLASS}>
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function target(props: BackLinkProps, from: string | null) {
  if (props.partnersTab && from !== 'list') {
    return { href: `/partners?tab=${props.partnersTab}`, label: 'Back to Partners' };
  }
  return { href: props.href, label: props.label };
}

function BackLinkInner(props: BackLinkProps) {
  const { href, label } = target(props, useSearchParams().get('from'));
  return <Anchor href={href} label={label} className={props.className} />;
}

export function BackLink(props: BackLinkProps) {
  // useSearchParams needs a Suspense boundary; the default target is the fallback.
  const fallback = target(props, null);
  return (
    <Suspense fallback={<Anchor href={fallback.href} label={fallback.label} className={props.className} />}>
      <BackLinkInner {...props} />
    </Suspense>
  );
}
