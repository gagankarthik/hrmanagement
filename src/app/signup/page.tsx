"use client";

import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, UserCheck, Clock } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f1ea] px-4 py-12">
      {/* Light-theme atmosphere: brand/brand radial tints + a whisper-faint grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(100% 70% at 50% -10%, rgba(16,61,51,0.12) 0%, transparent 55%), radial-gradient(70% 60% at 100% 100%, rgba(38,107,85,0.10) 0%, transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(75% 55% at 50% 40%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(75% 55% at 50% 40%, black 0%, transparent 80%)",
        }}
      />

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Back */}
        <Link
          href="/login"
          className="mb-7 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {/* Card */}
        <div className="surface space-y-6 p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <BrandMark size={36} className="shadow-sm" />
            <span className="font-display text-lg font-bold text-slate-900">Cadre</span>
          </div>

          <div>
            <p className="eyebrow">Request access</p>
            <h1 className="font-display mt-2 text-[1.7rem] font-bold leading-tight text-slate-900">Join your team on Cadre</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Cadre accounts are provisioned by HR administrators. Contact your admin to get started.
            </p>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">How it works</p>
            {[
              { icon: Mail, step: "1", text: "Contact your HR administrator with your work email" },
              { icon: UserCheck, step: "2", text: "Admin creates your account in Cadre" },
              { icon: ShieldCheck, step: "3", text: "You receive an invite and sign in via SSO" },
              { icon: Clock, step: "~", text: "Access is typically granted within 1 business day" },
            ].map(({ icon: Icon, step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[11px] font-bold text-white shadow-sm shadow-brand-200/60">
                  {step}
                </div>
                <p className="flex items-start gap-2 pt-0.5 text-sm leading-snug text-slate-600">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <span>{text}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2">
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
