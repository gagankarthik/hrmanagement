import type { Metadata } from "next";
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { RouteProgressBar } from "@/components/ui/route-progress";

// Body — warm, friendly humanist sans
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// Display — bold, characterful grotesque for headings
const bricolageDisplay = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZenHR - HR Management System",
  description: "A type-safe, modern HR management dashboard for managing W2, Contract, 1099, and Offshore employees.",
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
        className={`${hankenGrotesk.variable} ${bricolageDisplay.variable} ${jetbrainsMono.variable} antialiased`}
      >
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
