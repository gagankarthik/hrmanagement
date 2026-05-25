"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ShieldCheck, BarChart3, Eye, EyeOff } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export default function LoginPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf6ef]">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden px-12 py-10 lg:flex lg:w-[46%]">
        {/* Brand atmosphere — deep brand→brand wash with radial bloom + faint grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700" aria-hidden />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.16) 0%, transparent 45%), radial-gradient(90% 90% at 0% 100%, rgba(255,255,255,0.22) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(120% 120% at 30% 20%, black 0%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(120% 120% at 30% 20%, black 0%, transparent 75%)",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <BrandMark size={38} variant="light" className="shadow-sm" />
          <span className="font-display text-xl font-bold tracking-tight text-white">ZenHR</span>
        </div>

        <div className="relative space-y-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">Workforce Platform</p>
            <h1 className="font-display mt-3 text-[2.75rem] font-bold leading-[1.04] text-white">
              HR management<br />for modern teams
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-brand-100/90">
              One platform to manage employees, vendors, clients, and compliance — all in one place.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Users, title: "Workforce Management", body: "W2, Contract, 1099 & Offshore employees" },
              { icon: ShieldCheck, title: "Compliance Tracking", body: "Work authorization alerts & expiry monitoring" },
              { icon: BarChart3, title: "Real-time Analytics", body: "Insights across your entire workforce" },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-brand-100/80">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-200/80">© 2024 ZenHR · Secure HR Platform</p>
      </div>

      {/* Right sign-in panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#fbf6ef] px-6 py-12 sm:px-8">
        {/* Subtle light-theme atmosphere behind the card */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(110% 80% at 50% -10%, rgba(3,54,61,0.10) 0%, transparent 55%), radial-gradient(80% 70% at 100% 110%, rgba(29,100,87,0.08) 0%, transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(80% 60% at 50% 40%, black 0%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(80% 60% at 50% 40%, black 0%, transparent 80%)",
          }}
        />

        {/* Mobile logo */}
        <div className="relative mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark size={38} className="shadow-sm" />
          <span className="font-display text-xl font-bold text-slate-900">ZenHR</span>
        </div>

        <div className="surface relative w-full max-w-[400px] space-y-6 p-7 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2 className="font-display mt-2 text-[1.7rem] font-bold leading-tight text-slate-900">Sign in to ZenHR</h2>
            <p className="mt-1.5 text-sm text-slate-500">Access your HR dashboard and live workforce insights.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Request access
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400">
            By continuing you agree to our{" "}
            <span className="cursor-pointer underline decoration-slate-300">Terms</span> and{" "}
            <span className="cursor-pointer underline decoration-slate-300">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
