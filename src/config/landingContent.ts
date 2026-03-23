export const landingPageContent = {
  branding: {
    name: "ZenHR",
    tagline: "TypeSafe",
    logoIcon: "fa-cubes",
  },

  navigation: [
    { label: "Product", href: "#product" },
    { label: "Why ZenHR", href: "#why" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "#pricing" },
  ],

  hero: {
    badge: {
      icon: "fa-shield-halved",
      text: "100% TypeSafe · built with TypeScript"
    },
    headline: {
      gradient: "HR,",
      regular: "without the\nguesswork."
    },
    subheadline: "From contracts to culture — a type-safe, beautifully crafted HR system that teams love. Static typing meets delightful UX.",
    cta: {
      primary: { text: "See live dashboard", href: "/dashboard", icon: "fa-eye" },
      secondary: { text: "Why choose us", icon: "fa-circle-check" }
    },
    stats: [
      { icon: "fa-clock", label: "100% uptime SLA" },
      { icon: "fa-keyboard", label: "full TypeScript" },
      { icon: "fa-star", label: "4.98 / 5" }
    ]
  },

  features: [
    {
      title: "TypeScript core",
      description: "End-to-end type safety means fewer bugs, clearer intent, and a rock-solid foundation. No more guessing at runtime.",
      icon: "fa-code"
    },
    {
      title: "Real-time dashboards",
      description: "Live metrics, instant updates. See what's happening across your organization the moment it happens.",
      icon: "fa-chart-line"
    },
    {
      title: "Role-based views",
      description: "Show executives the big picture, managers their teams, and employees their own profiles—all in one system.",
      icon: "fa-users-gear"
    },
    {
      title: "Contract management",
      description: "Track W2, 1099, Contract, and Offshore employees with type-safe workflows tailored to each.",
      icon: "fa-file-contract"
    },
    {
      title: "Authorization tracking",
      description: "Never miss an expiration. Automatic alerts keep your compliance team ahead of visa and work auth deadlines.",
      icon: "fa-shield-check"
    },
    {
      title: "Beautiful exports",
      description: "Generate CSVs and PDFs with one click. Perfect for audits, reports, or sharing with your team.",
      icon: "fa-download"
    }
  ],

  differentiation: {
    title: "What makes us different?",
    subtitle: "Traditional HR systems are bloated, slow, and error-prone. ZenHR is lean, fast, and type-safe.",
    points: [
      "Type-safe by default—catch errors at compile time, not in production",
      "Real-time dashboards with WebSocket sync (no more refresh button)",
      "Role-based views that adapt to your team structure",
      "Modern tech stack: Next.js, TypeScript, DynamoDB, Tailwind"
    ],
    comparisonTable: [
      { feature: "Static types", traditional: "❌", ours: "TypeScript end-to-end" },
      { feature: "Real-time updates", traditional: "Manual refresh", ours: "Live WebSocket sync" },
      { feature: "Mobile responsive", traditional: "Desktop only", ours: "Fluid on all devices" },
      { feature: "Setup time", traditional: "Weeks", ours: "Minutes" },
      { feature: "Price", traditional: "$$$", ours: "Transparent" }
    ]
  },

  testimonial: {
    quote: "ZenHR transformed how we manage our distributed team. The TypeScript foundation means we can trust the data, and the UX is simply delightful.",
    author: "Sarah Chen",
    role: "VP of People Operations",
    company: "TechCorp"
  },

  footer: {
    copyright: "© 2026 ZenHR. All rights reserved.",
    tagline: "Built with Next.js, Tailwind & TypeScript",
    social: [
      { platform: "GitHub", url: "https://github.com", icon: "fa-github" },
      { platform: "Twitter", url: "https://twitter.com", icon: "fa-twitter" },
      { platform: "LinkedIn", url: "https://linkedin.com", icon: "fa-linkedin" }
    ]
  },

  // Authentication links
  auth: {
    signIn: { text: "Sign in", href: "/login" },
    demo: { text: "Demo", href: "/dashboard" }
  }
};
