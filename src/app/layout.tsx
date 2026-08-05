import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { RouteProgressBar } from "@/components/ui/route-progress";
import { BRAND, SITE_URL } from "@/config/brand";

// Brand typeface — Geist Sans across display and body (Ocean Blue brand kit)
const geistSans = Geist({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// Display alias — same Geist family, used by the font-display utility for headings
const geistDisplay = Geist({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

// Geist Mono for code and labels
const geistMono = Geist_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Canonical host is the portal itself, not the marketing site.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.legalName} | ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.legalName, url: `https://${BRAND.domain}` }],
  creator: BRAND.legalName,
  publisher: BRAND.legalName,
  category: "business",
  keywords: [
    "Ocean Blue Corporation",
    "IT services and staffing",
    "enterprise IT delivery",
    "government IT projects",
    "W-2 contract 1099 offshore staffing",
    "employee portal",
    "workforce management",
  ],
  alternates: { canonical: "/" },
  // Public pages may be indexed; everything behind sign-in is excluded in
  // robots.ts and by the dashboard layout's own metadata.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    type: "website",
    siteName: BRAND.legalName,
    title: `${BRAND.legalName} | ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    url: "/",
    locale: "en_US",
    images: [{ url: "/logo.png", width: 277, height: 76, alt: BRAND.legalName }],
  },
  twitter: {
    card: "summary",
    title: `${BRAND.legalName} | ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: ["/logo.png"],
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistDisplay.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ToastProvider>
            <RouteProgressBar />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
