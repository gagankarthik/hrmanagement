"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Users, ShieldCheck, BarChart3, Eye, EyeOff } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
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
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-indigo-600 px-12 py-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ZenHR</span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug">
              HR Management<br />for Modern Teams
            </h1>
            <p className="mt-4 text-indigo-200 text-base leading-relaxed">
              One platform to manage employees, vendors, clients, and compliance — all in one place.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Users, title: "Workforce Management", body: "W2, Contract, 1099 & Offshore employees" },
              { icon: ShieldCheck, title: "Compliance Tracking", body: "Work authorization alerts & expiry monitoring" },
              { icon: BarChart3, title: "Real-time Analytics", body: "Insights across your entire workforce" },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-indigo-200">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-indigo-300">© 2024 ZenHR · Secure HR Platform</p>
      </div>

      {/* Right sign-in panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">ZenHR</span>
        </div>

        <div className="w-full max-w-[380px] space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to access your HR dashboard</p>
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
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
