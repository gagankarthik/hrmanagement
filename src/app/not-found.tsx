import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/config/brand';
import { Cta } from '@/components/landing/ui';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="horizon relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--hz-canvas)] px-6 text-center">
      {/* Quiet canvas: faint grid fading from the top + one cobalt tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(70% 55% at 50% 40%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(70% 55% at 50% 40%, black 0%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(45% 35% at 50% 20%, rgba(29,78,216,0.06) 0%, transparent 65%)',
        }}
      />

      <div className="relative">
        <Link href="/" className="inline-flex" aria-label={`${BRAND.name} home`}>
          <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-9 w-auto" />
        </Link>

        <p className="hz-eyebrow mt-12 text-[var(--hz-amber)]">Error 404</p>
        <p className="hz-display mt-4 text-[clamp(5rem,16vw,9rem)] leading-none text-[rgba(29,78,216,0.14)]" aria-hidden>
          404
        </p>
        <h1 className="hz-display mt-2 max-w-xl text-balance text-[1.75rem] text-[var(--hz-text)] sm:text-[2.1rem]">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
          The page you&apos;re after doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Cta href="/dashboard" variant="primary" icon="arrow">Go to dashboard</Cta>
          <Cta href="/" variant="ghostLight">Back to home</Cta>
        </div>
      </div>
    </main>
  );
}
