"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword, confirmResetPassword } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setNotice(`We've sent a verification code to ${email}.`);
      setStep("confirm");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmResetPassword(email, code.trim(), newPassword);
      router.push("/login?reset=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8fafc] px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(110% 80% at 50% -10%, rgba(29,78,216,0.10) 0%, transparent 55%), radial-gradient(80% 70% at 100% 110%, rgba(42,216,239,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative mb-8 flex items-center gap-2.5">
        <Image src="/logo.png" alt="Ocean Blue" width={277} height={76} priority className="h-9 w-auto" />
      </div>

      <div className="surface relative w-full max-w-[400px] space-y-6 p-7 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <p className="eyebrow">Account recovery</p>
          <h2 className="font-display mt-2 text-[1.7rem] font-bold leading-tight text-slate-900">
            {step === "request" ? "Reset your password" : "Enter your code"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {step === "request"
              ? "Enter your email and we'll send a verification code."
              : "Enter the code we emailed you and choose a new password."}
          </p>
        </div>

        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              {submitting ? "Sending…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="block text-sm font-medium text-slate-700">Verification code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm tracking-widest text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">New password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPwd" className="block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                id="confirmPwd"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              {submitting ? "Resetting…" : "Reset password"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("request"); setError(null); setNotice(null); }}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Use a different email
            </button>
          </form>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
