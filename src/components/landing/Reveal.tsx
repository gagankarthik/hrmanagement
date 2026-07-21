'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, string> = {
  up: 'translate-y-6',
  down: '-translate-y-6',
  left: 'translate-x-6',
  right: '-translate-x-6',
  none: 'scale-[0.98]',
};

/**
 * Scroll-triggered reveal. Fades + slides its children in the first time they
 * enter the viewport, then stays put. Honors prefers-reduced-motion (children
 * render immediately with no transform). Use `delay` to stagger siblings.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  direction = 'up',
  delay = 0,
  className,
  once = true,
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  direction?: Direction;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cn(
        'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
        shown ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : cn('opacity-0', OFFSET[direction]),
        className,
      )}
    >
      {children}
    </Tag>
  );
}
