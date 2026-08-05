import type { Metadata } from 'next';
import DashboardShell from '@/components/dashboard/DashboardShell';

/**
 * Server layout for every signed-in route. Its only job beyond rendering the
 * shell is this metadata: nothing behind sign-in may be indexed or cached by a
 * search engine, since it is all employee records.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
