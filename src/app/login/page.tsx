"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { friendlyError } from "@/lib/errors";
import { isSelfServiceOnly, SELF_SERVICE_HOME } from "@/config/access";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/config/brand";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const inputCls =
  "h-10 w-full rounded-[8px] border border-[var(--adm-line)] bg-white px-3 text-sm text-[var(--adm-ink)] shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] outline-none transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)]";
const labelCls = "block text-sm font-medium text-[var(--adm-ink)]";

export default function LoginPage() {
  const { isAuthenticated, isLoading, signIn, newPasswordRequired, confirmNewPassword, roles } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      // Self-service (recruiter / sales) users land in their limited portal.
      router.push(isSelfServiceOnly(roles) ? SELF_SERVICE_HOME : "/dashboard");
    }
  }, [isAuthenticated, roles, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetNewPassword = async (e: FormEvent) => {
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
    // Cognito requires phone_number in E.164 format, e.g. +14155552671
    const toE164 = (raw: string) => {
      let cleaned = raw.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`; // 00 intl prefix → +
      cleaned = cleaned.replace(/(?!^)\+/g, ""); // drop any non-leading +
      if (!cleaned) return "";
      return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    };
    const phoneE164 = toE164(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(phoneE164)) {
      setError("Enter a valid phone number with country code, e.g. +1 415 555 2671.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmNewPassword(newPassword, {
        name: fullName.trim(),
        phone_number: phoneE164,
      });
    } catch (err: unknown) {
      setError(friendlyError(err, "Could not set your new password."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--hz-surface)]">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--adm-line)] border-t-[var(--adm-accent)]" />
      </div>
    );
  }

  return (
    <div className="horizon relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--hz-surface)]">
      {/* Quiet canvas — faint grid fading from the top + one soft cobalt tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(75% 60% at 50% 0%, black 0%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(75% 60% at 50% 0%, black 0%, transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(29,78,216,0.06) 0%, transparent 65%)",
        }}
      />

      {/* Top bar — back to the landing */}
      <div className="relative z-10 px-5 pt-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--adm-line)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)] transition-colors hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to home
        </Link>
      </div>

      {/* Centered gateway card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="rounded-[14px] border border-[var(--adm-line)] bg-white p-6 shadow-[0_18px_50px_-22px_rgba(15,23,42,0.25)] animate-in fade-in slide-in-from-bottom-3 duration-500 sm:p-8">
            <Image src="/logo.png" alt={BRAND.name} width={277} height={76} priority className="h-8 w-auto" />

            {newPasswordRequired ? (
              <>
                <h1 className="hz-display mt-6 text-[1.45rem] text-[var(--adm-ink)]">Set a new password</h1>
                <p className="mt-1.5 text-sm text-[var(--adm-ink-mute)]">
                  Your account was created with a temporary password. Choose a new one to continue.
                </p>

                <form onSubmit={handleSetNewPassword} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className={labelCls}>Full name</label>
                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className={labelCls}>Phone number</label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 415 555 2671"
                      className={inputCls}
                    />
                    <p className="text-xs text-[var(--adm-ink-subtle)]">Include your country code (e.g. +1 for the US).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className={labelCls}>New password</label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPwd" className={labelCls}>Confirm password</label>
                    <input
                      id="confirmPwd"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>

                  {error && (
                    <div role="alert" className="rounded-[8px] border border-rose-200 bg-[var(--adm-danger-soft)] px-3.5 py-2.5 text-sm text-[var(--adm-danger)]">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-primary h-10 w-full">
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : null}
                    {submitting ? "Saving…" : "Set password & continue"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="hz-display mt-6 text-[1.45rem] text-[var(--adm-ink)]">Sign in to {BRAND.name}</h1>
                <p className="mt-1.5 text-sm text-[var(--adm-ink-mute)]">Your workforce, one secure place.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className={labelCls}>Email</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid={!!error}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className={labelCls}>Password</label>
                      <Link href="/forgot-password" className="text-xs font-medium text-[var(--adm-accent)] hover:text-[var(--adm-accent-strong)]">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        aria-invalid={!!error}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="rounded-[8px] border border-rose-200 bg-[var(--adm-danger-soft)] px-3.5 py-2.5 text-sm text-[var(--adm-danger)]">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-primary h-10 w-full">
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : null}
                    {submitting ? "Signing in…" : "Sign in"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-[var(--adm-ink-mute)]">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-semibold text-[var(--adm-accent)] hover:text-[var(--adm-accent-strong)]">
                    Request access
                  </Link>
                </p>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-[var(--adm-ink-subtle)]">
            © {new Date().getFullYear()} {BRAND.legalName} · Internal system · Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}
