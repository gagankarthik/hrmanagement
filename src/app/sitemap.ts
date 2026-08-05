import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/brand';

/** The public surface. Signed-in routes are excluded by design, see robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/platform`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/signup`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/accessibility`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
