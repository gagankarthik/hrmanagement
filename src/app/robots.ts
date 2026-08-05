import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/brand';

/**
 * Only the public pages are crawlable. Everything behind sign-in holds employee
 * records and must never be indexed, so the app routes are listed explicitly
 * rather than relying on the login redirect to hide them.
 */
const PRIVATE_PATHS = [
  '/api/',
  '/dashboard',
  '/my-dashboard',
  '/my-leave',
  '/my-attendance',
  '/my-documents',
  '/employees',
  '/onboard',
  '/partners',
  '/clients',
  '/endclients',
  '/vendors',
  '/subcontractors',
  '/leaves',
  '/billing',
  '/timesheets',
  '/invoices',
  '/margins',
  '/payroll',
  '/reports',
  '/compliance',
  '/i9',
  '/i983',
  '/documents',
  '/benefits',
  '/handbook',
  '/policies',
  '/procedures',
  '/users',
  '/backup',
  '/profile',
  '/docs',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/platform', '/privacy', '/terms', '/accessibility'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
