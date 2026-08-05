/**
 * Single source of truth for product branding.
 *
 * The product name is intentionally centralized here: changing `name` (and,
 * if desired, `domain`/`contactEmail`) rebrands every surface that imports
 * BRAND — nav, footer, auth pages, sidebar, page titles, reports. The logo
 * (BrandMark) is an abstract symbol, so a name change needs no new artwork.
 */
export const BRAND = {
  /** Working product name — swap this one value to rename everywhere. */
  name: 'Ocean Blue',
  /** Full legal/company name for titles, footer, and meta. */
  legalName: 'Ocean Blue Corporation',
  /** Category line shown beside the name in some chrome. */
  category: 'Workforce Platform',
  /** One-line positioning used in nav eyebrow / hero. */
  tagline: 'Workforce management for staffing teams',
  /** Longer value statement for hero + meta description. */
  description:
    'Run your entire workforce — W-2, contract, 1099, and offshore — alongside the client, vendor, and subcontractor relationships, compliance tracking, and reporting that staffing and consulting firms actually need.',
  /** Short value statement for cards / social. */
  shortDescription: 'The workforce system for staffing and consulting firms.',
  contactEmail: 'hr@oceanbluecorp.com',
  domain: 'oceanbluecorp.com',
} as const;

/**
 * Where this portal actually lives. The company website is `BRAND.domain`;
 * the portal is its own host, and canonical URLs / sitemap entries must point
 * here rather than at the marketing site. `NEXT_PUBLIC_APP_URL` wins when set
 * (Amplify provides it per environment).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || `https://hr.${BRAND.domain}`).replace(/\/$/, '');
