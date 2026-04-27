"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ShieldCheck, BarChart3, Layers } from "lucide-react";

export default function SignInPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const router = useRouter();

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

        <div className="w-full max-w-[380px] space-y-7">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to access your HR dashboard</p>
          </div>

          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue with SSO
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Request access
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400">
            By continuing you agree to our{" "}
            <span className="cursor-pointer underline decoration-slate-300">Terms</span>{" "}and{" "}
            <span className="cursor-pointer underline decoration-slate-300">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
