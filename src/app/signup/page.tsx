"use client";

import Link from "next/link";
import { ArrowLeft, Layers, Mail, ShieldCheck, UserCheck, Clock } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back */}
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">ZenHR</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Request Access</h1>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              ZenHR accounts are provisioned by HR administrators. Contact your admin to get started.
            </p>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">How it works</p>
            {[
              { icon: Mail, step: "1", text: "Contact your HR administrator with your work email" },
              { icon: UserCheck, step: "2", text: "Admin creates your account in ZenHR" },
              { icon: ShieldCheck, step: "3", text: "You receive an invite and sign in via SSO" },
              { icon: Clock, step: "~", text: "Access is typically granted within 1 business day" },
            ].map(({ icon: Icon, step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                  {step}
                </div>
                <p className="text-sm text-slate-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
