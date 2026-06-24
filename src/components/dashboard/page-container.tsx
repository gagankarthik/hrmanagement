import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageContainer — the standard wrapper for every dashboard page.
 *
 * Enforces one consistent vertical rhythm (`space-y-6`) so pages stop drifting
 * between space-y-3/4/5/6. The page's max-width and horizontal padding come from
 * the dashboard layout; this only owns the spacing between a page's top-level
 * blocks (PageHeader → stats → table/cards).
 *
 * Usage:
 *   <PageContainer>
 *     <PageHeader … />
 *     <StatGrid>…</StatGrid>
 *     <div className="surface">…</div>
 *   </PageContainer>
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
