'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Mail } from 'lucide-react';

/* Shared HORIZON primitives — the same button/eyebrow/photo vocabulary as the
   company site (oceanbluecorp.com), so both surfaces read as one brand. */

/* Icons referenced by name so server components can use <Cta> without passing
   component functions across the RSC boundary. */
const CTA_ICONS = {
  upRight: ArrowUpRight,
  arrow: ArrowRight,
  mail: Mail,
} as const;

/** Pill CTA with a nested circular icon chip ("button-in-button"). */
export function Cta({
  href,
  children,
  variant = 'primary',
  icon = 'upRight',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghostLight' | 'ghostDark';
  icon?: keyof typeof CTA_ICONS;
  className?: string;
}) {
  const Icon = CTA_ICONS[icon];
  const base =
    'group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-[14px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]';
  const variants = {
    primary:
      'bg-[var(--hz-cobalt)] text-white hover:bg-[var(--hz-cobalt-600)] shadow-[0_14px_34px_-14px_rgba(37,99,235,0.7)]',
    ghostLight:
      'border border-black/[0.08] bg-[var(--hz-canvas)] text-[var(--hz-text)] hover:border-[var(--hz-cobalt)]',
    ghostDark:
      'border border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]',
  } as const;
  const iconWrap =
    variant === 'primary' ? 'bg-white/20' : variant === 'ghostDark' ? 'bg-white/10' : 'bg-black/[0.05]';

  const inner = (
    <>
      <span>{children}</span>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${iconWrap} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </>
  );

  const cls = `${base} ${variants[variant]} ${className}`;
  const isExternal = /^(#|mailto:|tel:|https?:)/.test(href);
  return isExternal ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <Link href={href} className={cls}>{inner}</Link>
  );
}

/** Mono uppercase section eyebrow — amber on light, muted white on dark. */
export function Eyebrow({
  children,
  tone = 'light',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span className={`hz-eyebrow block ${tone === 'dark' ? 'text-white/60' : 'text-[var(--hz-amber)]'} ${className}`}>
      {children}
    </span>
  );
}

/** Word-by-word headline reveal: each word rises out of an overflow-hidden slot. */
export function WordsReveal({
  text,
  delay = 0,
  className = '',
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-top">
          <span
            className="hz-rise inline-block will-change-transform"
            style={{ animationDelay: `${delay + i * 0.06}s` }}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

