import * as React from 'react';

/**
 * Ocean Blue bespoke icon set — one hand-drawn glyph per domain concept.
 *
 * Same discipline as the company admin console: 24×24 viewBox, currentColor
 * stroke at 1.5, round caps/joins, no fills. Use these for identity surfaces
 * (nav, page headers, stat tiles); lucide-react stays for mechanical glyphs
 * (chevrons, close, arrows, search, spinners).
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export type IconProps = React.SVGProps<SVGSVGElement>;

function icon(children: React.ReactNode, displayName: string) {
  const Component = (props: IconProps) => (
    <svg {...base} aria-hidden {...props}>
      {children}
    </svg>
  );
  Component.displayName = displayName;
  return Component;
}

/** Asymmetric panel layout — the workspace overview. */
export const IconDashboard = icon(
  <>
    <rect x="3.5" y="3.5" width="7.5" height="17" rx="2" />
    <rect x="14.5" y="3.5" width="6" height="7.5" rx="2" />
    <rect x="14.5" y="14.5" width="6" height="6" rx="2" />
  </>,
  'IconDashboard',
);

/** Two people, one in front. */
export const IconEmployees = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3.5 20c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3" />
    <path d="M15.5 5.2a3 3 0 0 1 0 5.6" />
    <path d="M18 14.9c1.8.8 3 2.4 3 4.6" />
  </>,
  'IconEmployees',
);

/** Clipboard with a welcome check. */
export const IconOnboarding = icon(
  <>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9 4.5a3 3 0 0 1 6 0" />
    <path d="M9.25 13.5l2 2 3.5-4.5" />
  </>,
  'IconOnboarding',
);

/** Hub and spokes — the partner network. */
export const IconPartners = icon(
  <>
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M6.5 6.5L10 10M17.5 6.5L14 10M6.5 17.5L10 14M17.5 17.5L14 14" />
  </>,
  'IconPartners',
);

/** Calendar with a day marked off. */
export const IconLeave = icon(
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
    <path d="M9.5 15.5l1.75 1.75L14.5 14" />
  </>,
  'IconLeave',
);

/** Wallet with card slot. */
export const IconBilling = icon(
  <>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h10" />
    <rect x="4" y="7" width="16.5" height="13" rx="2" />
    <path d="M15.5 13.5h2.5" />
  </>,
  'IconBilling',
);

/** Bars with a headline trend dot. */
export const IconReports = icon(
  <>
    <path d="M4 20.5h16.5" />
    <path d="M7 20v-5.5M12 20V9.5M17 20v-8" />
    <circle cx="17" cy="7" r="1.75" />
  </>,
  'IconReports',
);

/** Open book with a bound spine. */
export const IconHandbook = icon(
  <>
    <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v15H7a2.5 2.5 0 0 0-2.5 2.5z" />
    <path d="M4.5 20.5A2.5 2.5 0 0 1 7 18h12.5" />
    <path d="M8.5 7.5h7" />
  </>,
  'IconHandbook',
);

/** Clipboard with a checklist. */
export const IconProcedures = icon(
  <>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9 4.5a3 3 0 0 1 6 0" />
    <path d="M8.75 11.5h.01M11.75 11.5h3.5M8.75 15.5h.01M11.75 15.5h3.5" />
  </>,
  'IconProcedures',
);

/** Document bearing a seal. */
export const IconPolicies = icon(
  <>
    <path d="M6.5 3h8L19 7.5V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v5h5" />
    <circle cx="11.75" cy="14" r="2.25" />
    <path d="M10.5 15.9L10 19l1.75-1 1.75 1-.5-3.1" />
  </>,
  'IconPolicies',
);

/** Heart with a pulse line. */
export const IconBenefits = icon(
  <>
    <path d="M12 20.25S4.9 15.7 3 11.2C1.85 8.4 3.7 5.5 6.7 5.5c2 0 3.3 1 4.3 2.6.4-.7 1-1.4 1.7-1.9" />
    <path d="M12 20.25s7.1-4.55 9-9.05c1.15-2.8-.7-5.7-3.7-5.7-.9 0-1.7.2-2.4.6" />
    <path d="M7 11.75h2.5l1.5-2.25 2 4 1.5-1.75H17" />
  </>,
  'IconBenefits',
);

/** Shield with a check. */
export const IconCompliance = icon(
  <>
    <path d="M12 3l7 2.8v5.4c0 4.5-2.9 8.4-7 9.8-4.1-1.4-7-5.3-7-9.8V5.8z" />
    <path d="M9 11.75l2 2 4-4.5" />
  </>,
  'IconCompliance',
);

/** Person with an admin gear. */
export const IconUsersAdmin = icon(
  <>
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M3.5 20c0-3.2 2.6-5.3 6-5.3 1 0 2 .2 2.8.6" />
    <circle cx="17.5" cy="16.5" r="2.1" />
    <path d="M17.5 12.9v1.4M17.5 18.7v1.4M21.1 16.5h-1.4M15.3 16.5h-1.4" />
  </>,
  'IconUsersAdmin',
);

/** Stacked database cylinders. */
export const IconBackup = icon(
  <>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
    <path d="M5 5.5v6.5c0 1.45 3.1 2.6 7 2.6s7-1.15 7-2.6V5.5" />
    <path d="M5 12v6.5c0 1.45 3.1 2.6 7 2.6s7-1.15 7-2.6V12" />
  </>,
  'IconBackup',
);

/** Folder of personal documents. */
export const IconDocuments = icon(
  <>
    <path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </>,
  'IconDocuments',
);

/** Clock face — hours on a timesheet. */
export const IconTimesheets = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
  'IconTimesheets',
);

/** Invoice — folded document with amount lines. */
export const IconInvoices = icon(
  <>
    <path d="M6.5 3h8L19 7.5V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 13h7M8.5 16.5h4.5" />
  </>,
  'IconInvoices',
);

/** Upward margin trend over an axis. */
export const IconMargins = icon(
  <>
    <path d="M4 4v15.5h16.5" />
    <path d="M7.5 15.5l4-4.5 3 3 5-6" />
  </>,
  'IconMargins',
);
