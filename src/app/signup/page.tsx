import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: 'Getting an account',
  description: `How to get a ${BRAND.legalName} portal account. Accounts are created by HR, so the way in is to contact ${BRAND.contactEmail}.`,
  robots: { index: false, follow: true },
};

const MAIL_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent('Portal account request')}&body=${encodeURIComponent(
  `Hi HR,\n\nI need access to the ${BRAND.name} portal.\n\nFull name:\nWork email:\nTeam or manager:\n\nThanks,`,
)}`;

/**
 * There is no self sign-up: accounts are provisioned by HR. This page answers
 * "how do I get in" and hands the visitor a pre-filled email, rather than a
 * form that would only pretend to register them.
 */
const steps = [
  {
    icon: Mail,
    title: 'Email HR',
    body: `Write to ${BRAND.contactEmail} with your full name, work email, and the team or manager you report to.`,
  },
  {
    icon: UserCheck,
    title: 'HR creates your account',
    body: 'They set the access your role needs: self-service for your own leave and documents, or full access for HR and administrators.',
  },
  {
    icon: KeyRound,
    title: 'You set your password',
    body: 'An invite arrives by email. Follow it, choose your own password, and you are in.',
  },
];

export default function GettingAnAccountPage() {
  return (
    <main id="main" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-16">
      {/* Light-theme atmosphere: brand tints + a whisper-faint grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(100% 70% at 50% -10%, rgba(29,78,216,0.12) 0%, transparent 55%), radial-gradient(70% 60% at 100% 100%, rgba(42,216,239,0.10) 0%, transparent 50%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(75% 55% at 50% 40%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(75% 55% at 50% 40%, black 0%, transparent 80%)',
        }}
      />

      <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Link
          href="/login"
          className="mb-7 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--adm-accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to sign in
        </Link>

        <div className="surface p-7 sm:p-9">
          <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-8 w-auto" />

          <h1 className="font-display mt-7 text-[1.75rem] font-bold leading-tight tracking-[-0.015em] text-slate-900">
            Getting an account
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            There is no self sign-up. {BRAND.legalName} portal accounts are created for you by HR or
            an administrator, and this login is separate from your company website account.
          </p>

          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="relative flex-none">
                  <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]" aria-hidden>
                    <s.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                  {i < steps.length - 1 && (
                    <span aria-hidden className="absolute left-1/2 top-11 h-6 w-px -translate-x-1/2 bg-[var(--adm-line)]" />
                  )}
                </span>
                <span className="min-w-0 pb-1">
                  <span className="block text-[15px] font-semibold text-slate-900">{s.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-slate-500">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <a href={MAIL_HREF} className="btn-primary mt-8 w-full">
            <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Email HR
          </a>

          <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-success)]" strokeWidth={1.75} aria-hidden />
            Access is usually granted within one business day. If your invite has not arrived by
            then, reply to your original email and HR will chase it.
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--adm-accent)] hover:text-[var(--adm-accent-strong)]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
