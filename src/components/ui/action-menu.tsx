'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionMenuItem = {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

const MENU_WIDTH = 184;

/**
 * Kebab (3-dots) action menu. Renders its dropdown in a portal so it never gets
 * clipped by `overflow-hidden`/scrolling table containers. Closes on outside
 * click, Escape, scroll-away, or after an item runs.
 */
export function ActionMenu({
  items,
  label = 'Actions',
  align = 'end',
  buttonClassName,
}: {
  items: ActionMenuItem[];
  label?: string;
  align?: 'start' | 'end';
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const position = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const left =
      align === 'end'
        ? Math.max(8, r.right - MENU_WIDTH)
        : Math.min(window.innerWidth - MENU_WIDTH - 8, r.left);
    setCoords({ top: r.bottom + 6, left });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    position();
    const onScroll = () => position();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', position);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, position]);

  if (!items.length) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700',
          open && 'bg-slate-100 text-slate-700',
          buttonClassName,
        )}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {mounted && open && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="surface fixed z-[61] overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-100"
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={i}>
                  {item.separatorBefore && <div className="my-1 h-px bg-slate-100" />}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      item.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
                    {item.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
