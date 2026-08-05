import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Mail } from 'lucide-react';
import { BRAND } from '@/config/brand';

/**
 * The one footer for every public surface (landing, platform, legal pages).
 * Three columns of links, then a bottom bar carrying the copyright, the legal
 * set, and the line that says what this system is.
 */

const columns: { heading: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    heading: 'Company',
    links: [
      { href: '/#company', label: 'Who we are' },
      { href: '/#culture', label: 'Culture' },
      { href: '/#benefits', label: 'Benefits' },
      { href: `https://${BRAND.domain}`, label: BRAND.domain, external: true },
    ],
  },
  {
    heading: 'Portal',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/platform', label: 'The platform' },
      { href: '/signup', label: 'Getting an account' },
      { href: '/handbook', label: 'Handbook' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of use' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
];

const linkClass =
  'inline-flex items-center gap-1 text-[13.5px] text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-cobalt)]';

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-[var(--hz-line)] bg-[var(--hz-canvas)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 sm:py-16 2xl:max-w-[96rem]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex" aria-label={`${BRAND.name} home`}>
              <Image src="/logo.png" alt={BRAND.name} width={170} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">
              IT services and staffing. We put capable teams on hard enterprise and government work,
              and look after them properly while they do it.
            </p>
            <a href={`mailto:${BRAND.contactEmail}`} className={`${linkClass} mt-5`}>
              <Mail className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {BRAND.contactEmail}
            </a>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="lg:col-span-2 lg:col-start-auto">
              <h2 className="hz-eyebrow text-[var(--hz-text-subtle)]">{col.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {l.label}
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                      </a>
                    ) : (
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--hz-line)] pt-6 text-[12.5px] text-[var(--hz-text-subtle)] lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
          <p>Access limited to authorized {BRAND.legalName} teams.</p>
        </div>
      </div>
    </footer>
  );
}
