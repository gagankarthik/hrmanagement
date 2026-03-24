"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans antialiased dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      
      {/* Animated background elements - from first design */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-200/40 to-transparent rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-sky-200/40 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
        {/* Grid pattern from second design */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMDA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 dark:opacity-10" />
      </div>

      {/* Custom Styles - merged animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(30px, 10px) scale(1.02); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-blob { animation: blob 8s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite; animation-delay: 1.5s; }
        .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.6s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
      `}</style>

      {/* Navigation - merged glassmorphism from both designs */}
      <header className={`relative z-50 mx-auto max-w-7xl px-6 pt-6 md:px-12 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
        <nav className="relative rounded-2xl border border-white/60 bg-white/80 px-6 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 blur-lg opacity-50" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
                  <i className="fa-solid fa-cubes text-white text-lg"></i>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">ZenHr</span>
            </div>
            
            <div className="hidden items-center gap-8 md:flex">
              {['Employees', 'Vendors', 'Clients', 'Onboarding', 'Pricing'].map((item) => (
                <a key={item} href="#" className="group relative text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {item}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <a href="/login" className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Sign in
              </a>
              <a href="/dashboard" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section - merged both designs */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 md:px-12 md:pt-28">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:gap-20">
          
          {/* Left Content - enhanced with second design elements */}
          <div className={`flex-1 space-y-8 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 dark:border-violet-800 dark:bg-violet-900/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
              </span>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                <i className="fa-solid fa-shield-halved mr-1"></i>100%  · Trusted by 2,500+ companies
              </span>
            </div>
            
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent animate-gradient">HR,</span>
              <span className="text-slate-900 dark:text-white"> without the<br />guesswork.</span>
            </h1>
            
            <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              The all-in-one type-safe HR platform for managing employees, vendors, and clients. 
              Streamline onboarding, automate workflows, and build stronger relationships with everyone who matters.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a href="/dashboard" className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-violet-500/30 transition-all hover:shadow-violet-500/40">
                <span className="relative z-10">Start Free Trial</span>
                <i className="fa-regular fa-eye relative z-10"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
              <a href="#demo" className="group inline-flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 shadow-lg transition-all hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900 dark:to-indigo-900">
                  <i className="fa-regular fa-circle-check text-violet-600 dark:text-violet-400"></i>
                </div>
                Why Choose Us
              </a>
            </div>
            
            {/* Micro stats - from second design */}
            <div className="flex flex-wrap gap-6 pt-6 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div><i className="fa-regular fa-clock mr-1 text-indigo-500"></i> 99.9% uptime SLA</div>
              <div><i className="fa-brands fa-typescript mr-1 text-indigo-500"></i> full TypeScript</div>
              <div><i className="fa-regular fa-star mr-1 text-indigo-500"></i> 4.98 / 5</div>
            </div>
            
            {/* Social Proof - from first design */}
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex -space-x-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="relative h-12 w-12 overflow-hidden rounded-full border-3 border-white shadow-lg dark:border-slate-900">
                    <Image src={`https://i.pravatar.cc/96?img=${i+10}`} alt="User" fill className="object-cover" />
                  </div>
                ))}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-3 border-white bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg dark:border-slate-900">
                  +2k
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <i key={i} className="fa-solid fa-star text-amber-400 text-sm"></i>
                  ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">4.9/5 from 2,500+ reviews</span>
              </div>
            </div>
          </div>

          {/* Right Dashboard Preview - merged with second design elements */}
          <div className={`relative flex-1 ${mounted ? 'animate-slideUp stagger-2' : 'opacity-0'}`}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-violet-600/20 blur-2xl" />
              
              {/* Main dashboard card */}
              <div className="relative rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Live Dashboard · </span>
                  </div>
                </div>
                
                {/* Stats Grid - enhanced with icons */}
                <div className="mb-6 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Employees', value: '248', color: 'from-violet-500 to-indigo-500', icon: 'fa-users' },
                    { label: 'Vendors', value: '56', color: 'from-sky-500 to-cyan-500', icon: 'fa-building' },
                    { label: 'Clients', value: '132', color: 'from-emerald-500 to-teal-500', icon: 'fa-handshake' },
                    { label: 'Onboarding', value: '12', color: 'from-amber-500 to-orange-500', icon: 'fa-rocket' },
                  ].map((stat, i) => (
                    <div key={stat.label} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-4 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl`}>
                      <i className={`fa-solid ${stat.icon} absolute -right-2 -top-2 text-5xl text-white/10`}></i>
                      <p className="text-xs font-medium text-white/80">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                
                {/* Bar Chart - from second design */}
                <div className="mb-5 flex h-20 w-full items-end gap-1">
                  <div className="h-8 w-1/6 rounded-t-md bg-indigo-300 dark:bg-indigo-800"></div>
                  <div className="h-12 w-1/6 rounded-t-md bg-indigo-400 dark:bg-indigo-700"></div>
                  <div className="h-16 w-1/6 rounded-t-md bg-indigo-500 dark:bg-indigo-600"></div>
                  <div className="h-10 w-1/6 rounded-t-md bg-indigo-600 dark:bg-indigo-500"></div>
                  <div className="h-14 w-1/6 rounded-t-md bg-indigo-400 dark:bg-indigo-700"></div>
                  <div className="h-6 w-1/6 rounded-t-md bg-indigo-300 dark:bg-indigo-800"></div>
                </div>
                
                {/* Activity Feed - from first design */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Activity</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">+12.5% this week</span>
                  </div>
                  {[
                    { name: 'Sarah Chen', action: 'completed onboarding', time: '2m ago', avatar: 5 },
                    { name: 'Marcus Johnson', action: 'added as vendor', time: '15m ago', avatar: 8 },
                    { name: 'Emily Davis', action: 'signed client contract', time: '1h ago', avatar: 9 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image src={`https://i.pravatar.cc/80?img=${item.avatar}`} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{item.name}</span> {item.action}
                        </p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating notification cards - merged styles */}
              <div className="absolute -left-6 top-20 animate-float rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                    <i className="fa-solid fa-check text-emerald-600 dark:text-emerald-400"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">New hire onboarded!</p>
                    <p className="text-xs text-slate-500">Type-safe profile created</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-24 animate-float-delayed rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
                    <i className="fa-brands fa-typescript text-violet-600 dark:text-violet-400"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">0 type errors</p>
                    <p className="text-xs text-slate-500">100% type-safe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section - from first design */}
      <section className={`mx-auto max-w-7xl px-6 py-20 md:px-12 ${mounted ? 'animate-fadeIn stagger-3' : 'opacity-0'}`}>
        <p className="text-center text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Trusted by industry leaders</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale">
          {['Stripe', 'Notion', 'Figma', 'Linear', 'Vercel', 'Raycast'].map((brand) => (
            <div key={brand} className="text-2xl font-bold tracking-tight text-slate-400 transition-all hover:text-slate-600 hover:grayscale-0 dark:text-slate-600 dark:hover:text-slate-400">
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - merged both designs */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div className={`text-center ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:from-violet-900/50 dark:to-indigo-900/50 dark:text-violet-300">
            <i className="fa-solid fa-bolt text-sm"></i>
            Powerful Features ·  Core
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            Type safety meets <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">human experience</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            From employee management to vendor relationships, client tracking to seamless onboarding — all in one beautifully crafted platform.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'TypeScript Core',
              description: 'End-to-end  from DB schema to UI props. Catch errors at compile time, not in production.',
              icon: 'fa-brands fa-typescript',
              gradient: 'from-violet-500 to-indigo-500',
              bg: 'from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50',
              code: 'interface Employee { readonly id: string; }'
            },
            {
              title: 'Employee Management',
              description: 'Complete employee lifecycle management with profiles, documents, time-off tracking, and performance reviews.',
              icon: 'fa-users',
              gradient: 'from-sky-500 to-cyan-500',
              bg: 'from-sky-50 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/50',
              code: null
            },
            {
              title: 'Vendor Portal',
              description: 'Centralized vendor management with contracts, compliance tracking, payment schedules, and performance metrics.',
              icon: 'fa-building',
              gradient: 'from-emerald-500 to-teal-500',
              bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50',
              code: null
            },
            {
              title: 'Client Relationships',
              description: 'Track client interactions, manage accounts, monitor project status, and maintain strong business relationships.',
              icon: 'fa-handshake',
              gradient: 'from-amber-500 to-orange-500',
              bg: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
              code: null
            },
            {
              title: 'Smart Onboarding',
              description: 'Automated onboarding workflows with task assignments, document collection, training modules, and progress tracking.',
              icon: 'fa-rocket',
              gradient: 'from-pink-500 to-rose-500',
              bg: 'from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50',
              code: null
            },
            {
              title: 'Zero-Trust Security',
              description: 'Every access logged, every role strictly typed. SOC2, GDPR, and ISO27001 certified by design.',
              icon: 'fa-lock',
              gradient: 'from-slate-500 to-zinc-500',
              bg: 'from-slate-50 to-zinc-50 dark:from-slate-950/50 dark:to-zinc-950/50',
              code: null
            }
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${feature.bg} p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${mounted ? 'animate-slideUp' : 'opacity-0'}`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
              
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                <i className={`${feature.icon} text-2xl text-white`}></i>
              </div>
              
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed dark:text-slate-400">{feature.description}</p>
              
              {feature.code && (
                <div className="mt-6 rounded-lg bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  <span className="text-indigo-700 dark:text-indigo-400">{feature.code}</span>
                </div>
              )}
              
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition-colors group-hover:text-violet-700 dark:text-violet-400">
                Learn more
                <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Makes Us Different - from second design */}
      <section className="mx-auto max-w-7xl px-6 pb-28 md:px-12">
        <div className="grid items-center gap-12 rounded-3xl border border-white/40 bg-white/75 p-8 backdrop-blur-md lg:grid-cols-2 lg:p-12 dark:border-white/10 dark:bg-black/50">
          <div>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl dark:text-slate-100">
              What makes us <span className="text-indigo-700 dark:text-indigo-400">different?</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-slate-700 dark:text-slate-300">
              Dashboards that don't just display — they tell stories. With built-in TypeScript contracts, your data is always in shape.
            </p>
            <ul className="mt-8 space-y-5">
              <li className="flex gap-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">✓</span>
                <span className="dark:text-slate-300"><span className="font-semibold">Type-safe by default</span> — no more runtime schema mismatches</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">✓</span>
                <span className="dark:text-slate-300"><span className="font-semibold">Real-time dashboards</span> — websocket sync with full TypeScript inference</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">✓</span>
                <span className="dark:text-slate-300"><span className="font-semibold">Role-based views</span> — exactly what each role needs, nothing less</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-6 dark:from-indigo-950 dark:to-black">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">vs traditional HR systems</span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">ZenHr advantage</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Static types</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">TypeScript end-to-end</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Dashboard latency</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">&lt;100ms realtime</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Customization</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tailwind + theming</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Dev experience</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Autocompletion · Generics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - from first design */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-12 md:p-16 ${mounted ? 'animate-fadeIn' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZjA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative grid gap-8 md:grid-cols-4">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '50K+', label: 'Active Users' },
              { value: '150+', label: 'Countries' },
              { value: '4.9', label: 'Average Rating' }
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-white md:text-5xl">{stat.value}</div>
                <div className="mt-2 text-violet-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - merged */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div className={`text-center ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            Ready to transform your HR?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Join thousands of companies already using ZenHr to manage their workforce more efficiently.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="/signup" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-violet-500/30 transition-all hover:shadow-violet-500/40">
              <span className="relative z-10">Start Free Trial</span>
              <i className="fa-solid fa-arrow-right relative z-10"></i>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <a href="/contact" className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer - merged from both designs */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-12">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                  <i className="fa-solid fa-cubes text-white"></i>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">ZenHr</span>
              </div>
              <p className="mt-4 max-w-xs text-slate-600 dark:text-slate-400">
                The modern  HR platform for growing teams. Manage employees, vendors, and clients all in one place.
              </p>
            </div>
            
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'API'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] }
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-slate-900 dark:text-white">{section.title}</h4>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-600 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2026 ZenHr. All rights reserved. · Built with Next.js, Tailwind, TypeScript
            </p>
            <div className="flex gap-4">
              {['github', 'twitter', 'linkedin'].map((social) => (
                <a key={social} href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-violet-100 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-violet-900 dark:hover:text-violet-400">
                  <i className={`fa-brands fa-${social} text-lg`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}