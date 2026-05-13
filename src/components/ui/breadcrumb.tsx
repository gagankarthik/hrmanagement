import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  className?: string;
}

export function Breadcrumb({ items, homeHref = '/dashboard', className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Link
        href={homeHref}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-sm"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="truncate rounded-lg px-2 py-1 font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900 hover:shadow-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate px-2 py-1 font-semibold',
                  isLast ? 'text-slate-900' : 'text-slate-500'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
