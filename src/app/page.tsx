import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans antialiased dark:bg-[#0b1423]">
      {/* background pattern & floating accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20" 
        style={{
          backgroundImage: 'linear-gradient(to right, #d9e2ef 1px, transparent 1px), linear-gradient(to bottom, #d9e2ef 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>
      <div className="fixed top-40 left-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl -z-10 dark:bg-blue-900/20"></div>
      <div className="fixed bottom-20 right-10 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl -z-10 dark:bg-indigo-900/20"></div>

      {/* header / nav (glass) */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 pt-6 md:px-12">
        <div className="rounded-2xl border border-white/50 bg-white/75 px-6 py-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-cubes text-3xl text-indigo-700 dark:text-indigo-400"></i>
              <span className="bg-gradient-to-r from-indigo-900 to-blue-800 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-indigo-300 dark:to-blue-300">ZenHR</span>
              <span className="ml-2 rounded-full bg-[#0f2b45] px-2 py-1 font-mono text-xs text-[#b2ddff] dark:bg-indigo-900 dark:text-indigo-200"><i className="fa-brands fa-typescript mr-1"></i>TypeSafe</span>
            </div>
            <nav className="hidden gap-8 text-sm font-medium text-slate-700 dark:text-slate-300 md:flex">
              <a href="#" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">Product</a>
              <a href="#" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">Why ZenHR</a>
              <a href="#" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">Dashboard</a>
              <a href="#" className="transition hover:text-indigo-700 dark:hover:text-indigo-400">Pricing</a>
            </nav>
            <div className="flex gap-3">
              <button className="rounded-full border border-slate-300/70 bg-white/50 px-5 py-2 text-sm font-medium shadow-sm transition hover:bg-white dark:border-slate-600 dark:bg-black/30 dark:text-slate-200 dark:hover:bg-black/60">Sign in</button>
              <button className="flex items-center gap-1 rounded-full bg-indigo-800 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700"><span>Demo</span><i className="fa-solid fa-arrow-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO with live dashboard peek */}
      <section className="mx-auto max-w-7xl px-6 pt-16 md:px-12 md:pt-20">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          {/* left text */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-black/50">
              <i className="fa-solid fa-shield-halved text-indigo-600 dark:text-indigo-400"></i>
              <span className="text-xs font-semibold uppercase tracking-wide dark:text-slate-300">100% TypeSafe · built with TypeScript</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 bg-clip-text text-transparent dark:from-indigo-300 dark:via-blue-300 dark:to-indigo-200">HR,</span> 
              <span className="text-slate-800 dark:text-slate-100">without the<br />guesswork.</span>
            </h1>
            <p className="max-w-lg text-lg text-slate-600 dark:text-slate-400">From contracts to culture — a type-safe, beautifully crafted HR system that teams love. Static typing meets delightful UX.</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="flex items-center gap-3 rounded-2xl bg-indigo-800 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-indigo-200/60 transition hover:bg-indigo-900 dark:bg-indigo-600 dark:shadow-indigo-900/30 dark:hover:bg-indigo-700"><span>See live dashboard</span> <i className="fa-regular fa-eye"></i></button>
              <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 text-lg font-semibold text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white dark:border-slate-700 dark:bg-black/50 dark:text-slate-200 dark:hover:bg-black/80"><i className="fa-regular fa-circle-check text-indigo-600 dark:text-indigo-400"></i>Why choose us</button>
            </div>
            {/* micro stats */}
            <div className="flex gap-6 pt-6 text-sm text-slate-500 dark:text-slate-400">
              <div><i className="fa-regular fa-clock mr-1 text-indigo-500"></i> 100% uptime SLA</div>
              <div><i className="fa-regular fa-keyboard mr-1 text-indigo-500"></i> full TypeScript</div>
              <div><i className="fa-regular fa-star mr-1 text-indigo-500"></i> 4.98 / 5</div>
            </div>
          </div>
          {/* right: mini dashboard preview */}
          <div className="relative w-full flex-1">
            <div className="rounded-[2rem] border border-white/30 bg-white/50 p-5 backdrop-blur-lg dark:border-white/10 dark:bg-black/50 md:p-6" 
              style={{ 
                boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.8), 0 18px 30px -10px rgba(0,40,80,0.3)'
              }}>
              {/* top row */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50"><i className="fa-solid fa-chart-pie text-sm text-indigo-700 dark:text-indigo-300"></i></div>
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">executive view</span>
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-300"></span>
                </div>
              </div>
              {/* kpi row */}
              <div className="mb-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/60 p-2 shadow-sm dark:bg-black/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">headcount</span>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">248</div>
                </div>
                <div className="rounded-xl bg-white/60 p-2 shadow-sm dark:bg-black/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">retention</span>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">94<span className="text-sm">%</span></div>
                </div>
                <div className="rounded-xl bg-white/60 p-2 shadow-sm dark:bg-black/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">open roles</span>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">12</div>
                </div>
              </div>
              {/* bar chart mock */}
              <div className="mb-5 flex h-20 w-full items-end gap-1">
                <div className="h-8 w-1/6 rounded-t-md bg-indigo-300 dark:bg-indigo-800"></div>
                <div className="h-12 w-1/6 rounded-t-md bg-indigo-400 dark:bg-indigo-700"></div>
                <div className="h-16 w-1/6 rounded-t-md bg-indigo-500 dark:bg-indigo-600"></div>
                <div className="h-10 w-1/6 rounded-t-md bg-indigo-600 dark:bg-indigo-500"></div>
                <div className="h-14 w-1/6 rounded-t-md bg-indigo-400 dark:bg-indigo-700"></div>
                <div className="h-6 w-1/6 rounded-t-md bg-indigo-300 dark:bg-indigo-800"></div>
              </div>
              {/* avatar stack */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <Image src="https://i.pravatar.cc/32?img=1" className="h-8 w-8 rounded-full border-2 border-white dark:border-black" width={32} height={32} alt="avatar" />
                  <Image src="https://i.pravatar.cc/32?img=2" className="h-8 w-8 rounded-full border-2 border-white dark:border-black" width={32} height={32} alt="avatar" />
                  <Image src="https://i.pravatar.cc/32?img=3" className="h-8 w-8 rounded-full border-2 border-white dark:border-black" width={32} height={32} alt="avatar" />
                  <Image src="https://i.pravatar.cc/32?img=4" className="h-8 w-8 rounded-full border-2 border-white dark:border-black" width={32} height={32} alt="avatar" />
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-brands fa-typescript mr-1"></i> typed$ npm run hr</span>
              </div>
            </div>
            {/* floating badge */}
            <div className="absolute -bottom-3 -left-4 flex items-center gap-2 rounded-full border border-white/50 bg-white/75 px-5 py-2 text-sm font-medium shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/75">
              <i className="fa-regular fa-bell text-indigo-600 dark:text-indigo-400"></i> 0 type errors · 100% safe
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US + WHAT MAKES US DIFFERENT */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-32 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold tracking-wider text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">✧ WHY LEADERS CHOOSE ZENHR ✧</span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl dark:text-slate-100">Type safety meets <br />human experience</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Not just another HR dashboard — we rebuilt HR around developer elegance & employee delight.</p>
        </div>

        {/* feature cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* card 1: typescript first */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50" 
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-brands fa-typescript"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">TypeScript core</h3>
            <p className="text-slate-600 dark:text-slate-400">End-to-end typesafe from DB schema to UI props. Catch errors at compile time, not in front of employees.</p>
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-slate-100 p-2 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-300"><span>interface</span> <span className="text-indigo-700 dark:text-indigo-400">Employee</span> <span>{`{`}</span> readonly id: string; <span>{`}`}</span></div>
          </div>
          {/* card 2: dashboard hyper-personalized */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50"
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-solid fa-chart-simple"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">Fluid dashboards</h3>
            <p className="text-slate-600 dark:text-slate-400">Role-based widgets that adapt. Managers see retention heatmaps, execs see DEI metrics — zero config.</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-2 w-16 rounded-full bg-indigo-200"></span>
              <span className="h-2 w-10 rounded-full bg-indigo-400"></span>
              <span className="h-2 w-12 rounded-full bg-indigo-300"></span>
              <span className="ml-auto text-xs text-indigo-500">live preview</span>
            </div>
          </div>
          {/* card 3: why choose us (privacy) */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50"
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-solid fa-lock"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">Zero-trust ready</h3>
            <p className="text-slate-600 dark:text-slate-400">Every access logged, every role strictly typed. SOC2, GDPR, and ISO27001 certified by design.</p>
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-900/30">
              <i className="fa-solid fa-shield-check text-emerald-600 dark:text-emerald-400"></i> 
              <span className="dark:text-slate-300">field-level encryption</span>
            </div>
          </div>
          {/* card 4: what makes us different: unified people graph */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50"
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-solid fa-diagram-project"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">People Graph™</h3>
            <p className="text-slate-600 dark:text-slate-400">Org chart that updates in real time, with relationship strength & skill mapping — not just boxes.</p>
            <div className="mt-6 flex">
              <span className="-mr-1 h-6 w-6 rounded-full border-2 border-white bg-indigo-100 dark:border-black dark:bg-indigo-900"></span>
              <span className="-mr-1 h-6 w-6 rounded-full border-2 border-white bg-indigo-200 dark:border-black dark:bg-indigo-800"></span>
              <span className="-mr-1 h-6 w-6 rounded-full border-2 border-white bg-indigo-300 dark:border-black dark:bg-indigo-700"></span>
              <span className="-mr-1 h-6 w-6 rounded-full border-2 border-white bg-indigo-400 dark:border-black dark:bg-indigo-600"></span>
            </div>
          </div>
          {/* card 5: automation that respects humanity */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50"
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-regular fa-clock"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">Ethical automation</h3>
            <p className="text-slate-600 dark:text-slate-400">Auto-schedule interviews, reminders, and reviews — but with a human-in-the-loop always.</p>
            <div className="mt-6 flex gap-2 text-xs">
              <span className="rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/30 dark:text-amber-200">🤝 handoff ready</span>
              <span className="rounded-full bg-indigo-100 px-2 py-1 dark:bg-indigo-900/30 dark:text-indigo-200">⚡ 82% time saved</span>
            </div>
          </div>
          {/* card 6: unique styling dashboards */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/10 dark:bg-black/50"
            style={{ boxShadow: '0 20px 35px -10px rgba(0,20,40,0.15), 0 1px 3px rgba(0,0,0,0.02)' }}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"><i className="fa-solid fa-palette"></i></div>
            <h3 className="mb-2 text-2xl font-bold dark:text-slate-100">Tailwind-styled UI</h3>
            <p className="text-slate-600 dark:text-slate-400">Fully customizable, dark mode ready, accessibility baked in. Every pixel designed for calm clarity.</p>
            <div className="mt-6 grid grid-cols-4 gap-1">
              <div className="h-2 w-full rounded-full bg-indigo-600"></div>
              <div className="h-2 w-full rounded-full bg-indigo-400"></div>
              <div className="h-2 w-full rounded-full bg-indigo-300"></div>
              <div className="h-2 w-full rounded-full bg-indigo-200"></div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT MAKES US DIFFERENCE SECTION with comparison */}
      <section className="mx-auto max-w-7xl px-6 pb-28 md:px-12">
        <div className="grid items-center gap-12 rounded-3xl border border-white/40 bg-white/75 p-8 backdrop-blur-md lg:grid-cols-2 lg:p-12 dark:border-white/10 dark:bg-black/50">
          <div>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl dark:text-slate-100">What makes us <span className="text-indigo-700 dark:text-indigo-400">different?</span></h2>
            <p className="mt-4 max-w-md text-lg text-slate-700 dark:text-slate-300">Dashboards that don't just display — they tell stories. With built-in TypeScript contracts, your data is always in shape.</p>
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
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">ZenHR advantage</span>
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

      {/* CTA and footer */}
      <footer className="border-t border-slate-200 bg-white/50 py-12 backdrop-blur-sm dark:border-slate-800 dark:bg-black/30">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-cubes text-2xl text-indigo-600"></i>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">ZenHR</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">© 2025 · TypeSafe HR platform · built with Next.js, Tailwind, TypeScript</p>
            <div className="flex gap-4 text-slate-400">
              <i className="fa-brands fa-github hover:text-indigo-600 cursor-pointer"></i>
              <i className="fa-brands fa-x-twitter hover:text-indigo-600 cursor-pointer"></i>
              <i className="fa-brands fa-linkedin hover:text-indigo-600 cursor-pointer"></i>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}