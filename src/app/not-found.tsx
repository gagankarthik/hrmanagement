import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/config/brand';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#f8fafc] px-6 text-center text-[#0f172a]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 50% 0%, rgba(29,78,216,0.07) 0%, transparent 55%), radial-gradient(50% 45% at 50% 100%, rgba(42,216,239,0.08) 0%, transparent 55%)',
        }}
      />

      <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
        <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-10 w-auto" />
      </Link>

      <p className="eyebrow mt-12">Error 404</p>
      <h1 className="mt-3 max-w-xl text-balance font-display text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-slate-600">
        The page you&apos;re after doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-accent px-6 py-3 text-base">Back to home</Link>
        <Link href="/dashboard" className="btn-ghost px-6 py-3 text-base">Go to dashboard</Link>
      </div>
    </main>
  );
}
