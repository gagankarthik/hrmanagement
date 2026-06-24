# ZenHR — Workforce Operations Platform

A Next.js app for managing W-2, Contract, 1099 and Offshore staffing operations. Live KPIs, compliance alerts, employee events and reporting — all in one place.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** primitives
- **AWS DynamoDB** (via `@aws-sdk/lib-dynamodb`) for the data layer
- **AWS Cognito** auth via Amplify + `oidc-client-ts`
- **lucide-react** icons, **date-fns** for date helpers
- Custom inline SVG charts (donuts, area, bar, sparkline, histogram, etc.) — no chart library dependency

## Pages — what each one contains

### `/` — Landing page (`src/app/page.tsx`)
Marketing page showcasing the product. Mobile-first responsive. Sections:
- Sticky nav with live "Operational" badge
- Hero with floating mock dashboard card
- Animated stats grid (count-up on scroll)
- Features bento grid covering: Operational Attention, Live Analytics, Compliance, Multi-class workforce, Hiring trend, Client/Vendor chains, Onboarding wizard, Milestones, Reports & Export
- Interactive tabbed dashboard preview (Operations / Analytics / Onboard)
- Employee class cards (W-2 / Contract / 1099 / Offshore)
- Workflow steps (Onboard → Assign → Monitor → Report)
- Final CTA + minimal footer

### `/login` and `/signup` — Auth pages
Cognito OAuth flow. Sign in or request access.

### `/dashboard` — Operational dashboard
The daily workforce control room. Sections:
- Clean white header with greeting (time-aware), date, refresh, filters
- Cross-cutting filter panel (Type / Status / Revenue / Client / Vendor)
- **AttentionPanel** — Expired auths, Expiring in 30 days, On Bench, New This Week. Each row opens a `PeopleListModal` showing the exact employees in that category with per-person context (expiry date, days remaining, etc.)
- **MetricsStrip** — Active count · Run-rate · Utilization · Expiring in 30d
- **Headcount by type** + **Status donut** (2-column responsive grid)
- **Top clients** + **Top vendors** (2-column responsive grid)
- **WorkforceInsights** — Auth expiry buckets, 24-week hiring trend, tenure distribution
- **MilestonesPanel** — Upcoming Birthdays + Work Anniversaries, both clickable cards that open the people modal
- **RecentActivity** — Last 8 employee create/update events with relative timestamps

### `/dashboard/analytics` — Comprehensive HR analytics
Every HR KPI derivable from the schema, rendered as interactive SVG charts. Click any chart segment to filter the entire page. Sections:
- **Critical Attention** — 4 large alert cards
- **Executive Summary** — 6 KPI tiles (Headcount, Run-Rate, Utilization, Avg Tenure, Avg Age, Time-to-Onboard)
- **Workforce Composition** — Class donut, Status donut, Billable/NB donut, Class × Status stacked bar
- **Compliance & Risk** — Authorization expiry buckets, Work auth type mix, Subcontractor + data quality ring scores
- **Financial Snapshot** — Run-rate by class, Pay distribution histogram, W-2 benefits adoption
- **Hiring Trends** — Weekly hires area chart (24w) + Monthly hires bar (12mo)
- **Tenure & Demographics** — Tenure histogram, Age histogram, Upcoming birthdays/anniversaries (clickable)
- **Geographic Distribution** — Top states + Top cities
- **Client & Vendor Network** — Top clients/vendors + end-clients/end-vendors
- **Offshore Workforce** — Payroll entity, Employment type, India ID coverage (Aadhar/PAN/PF)

### `/dashboard/employees` — Employee list
Tab-filterable list (All / W-2 / Contract / 1099 / Offshore) with summary stats, sortable table, page-size selector, modal-based create/edit/delete, click row to view detail.

### `/dashboard/employees/[id]` — Employee detail
Hero card with avatar + role + status. Sections: Personal Info, Employment Info, Client Assignments, Vendor Assignments, Work Authorization, India Tax & PF (Offshore only). Breadcrumb at top, Print/PDF and Delete actions. Wrapped in ErrorBoundary.

### `/dashboard/clients` — Client list
List of client organizations with search + status filter, hover-revealed actions, click to detail.

### `/dashboard/clients/[id]` — Client detail
Profile hero, contact info, employee type breakdown, full roster of assigned employees with expiry warnings. PDF export.

### `/dashboard/vendors` — Vendor list
Same pattern as clients. Vendors with auto-inactive tooltip when all assigned employees are terminated.

### `/dashboard/vendors/[id]` — Vendor detail
Same pattern as client detail.

### `/dashboard/onboard` — Employee onboarding wizard
Two-step intake form:
1. **Pick a class** — W-2 / Contract / 1099 / Offshore with descriptive cards
2. **Details** — Class-specific fields auto-generated. Plus dedicated panels for Client Assignments, Vendor Assignments, End-Client Assignments, End-Vendor Assignments (each supports multiple entries with start/end dates)
- **Draft auto-save** — Form persists to `localStorage` under `zenhr:onboard-draft:v1`. A draft-restored notice appears on return with a Discard option.
- **Validation toast** — Inline errors + `useToast` warning on submit failure.
- **Confetti on success** — `<Confetti />` particle burst fires when the employee is created. Success card shows the new hire's name; auto-redirects to the employees list.

### `/dashboard/reports` — Reports & exports
- Filter panel for Type / Status / Revenue / State / Client / Vendor
- CSV and PDF exports (PDF uses print stylesheet for client/vendor breakdowns)
- Section views grouped by class, by client, by vendor

## Component library

### `src/components/ui/`
Shared primitives used across pages:
- **`toast.tsx`** — `<ToastProvider>` + `useToast()` for success/error/warning/info; bottom-right stack, auto-dismiss
- **`error-boundary.tsx`** — Class boundary with retry fallback
- **`skeleton.tsx`** — `<Skeleton>`, `<SkeletonText>`, `<SkeletonCard>`, `<SkeletonTable>`
- **`empty-state.tsx`** — Empty state with icon + tone + action
- **`confirm-dialog.tsx`** — Generic delete/confirm modal
- **`stat-card.tsx`** — `<StatCard>` + `<StatGrid>` with tone presets
- **`sparkline.tsx`** — Inline SVG sparkline
- **`breadcrumb.tsx`** — Detail-page breadcrumbs
- **`route-progress.tsx`** — Thin top-of-page progress bar on route change
- **`confetti.tsx`** — Particle burst for celebrations

### `src/components/dashboard/`
Domain-specific:
- **`Sidebar.tsx`** — Collapsible navigation. Toggle button at bottom; state persists to `localStorage` under `zenhr:sidebar-collapsed`. Mobile drawer with hamburger.
- **`AttentionPanel.tsx`** — Operational alerts with modal drill-down
- **`MetricsStrip.tsx`** — Single-line KPI summary
- **`WorkforceInsights.tsx`** — Compact compliance + trend + tenure cards
- **`MilestonesPanel.tsx`** — Birthdays + Anniversaries clickable cards
- **`RecentActivity.tsx`** — Activity timeline
- **`PeopleListModal.tsx`** — Reusable modal showing employees in any category
- **`EmployeeDataTable.tsx`** + **`EmployeeTable.tsx`** — Employee tables with sort/filter/paginate
- **`EmployeeModal.tsx`**, **`ClientModal.tsx`**, **`VendorModal.tsx`** — Create/edit forms
- **`DeleteConfirmModal.tsx`** — Employee-specific delete dialog
- **`StatsCards.tsx`** — Legacy 12-card stats (still imported on some pages)
- **`AnalyticsCharts.tsx`** — Standalone analytics block used on dashboard variants
- **`StaffingKPIs.tsx`** — Staffing-domain KPI card grid
- **`FilterBar.tsx`** — Shared filter row

## Data model

See `src/types/employee.ts` for the full schema. Key shape:

```ts
type Employee = W2Employee | ContractEmployee | Employee1099 | OffshoreEmployee;

interface BaseEmployee {
  id, name, position, dob, hireDate, dor, address, city, state, pincode,
  contactNo, personalEmail,
  // Primary client/vendor IDs (derived from active assignment)
  clientId?, vendorId?, endClientId?, endVendorId?,
  // Multi-assignment with start/end dates
  clientAssignments?, vendorAssignments?, endClientAssignments?, endVendorAssignments?,
  createdAt, updatedAt,
}
```

Each subtype layers on class-specific fields: W-2 gets `medicalBenefit` / `benefit401k`, Offshore gets `aadharNumber` / `panNumber` / `pfNumber`, etc.

## API routes

- `GET /api/employees` — list (optionally `?type=W2|Contract|1099|Offshore`)
- `POST /api/employees` — create
- `GET /api/employees/[id]` — read
- `PUT /api/employees/[id]` — update
- `DELETE /api/employees/[id]` — delete
- Same CRUD pattern for `/api/clients` and `/api/vendors`

All API routes are thin DynamoDB wrappers. No business logic in the route handlers — the React contexts (`EmployeeContext`, `ClientContext`, `VendorContext`) call them and manage UI state.

## Environment

`.env.local` (not committed):

```
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_DYNAMODB_TABLE_NAME=HRManagement-Employees
# Single Cognito pool + app client (login + OIDC + Users admin)
NEXT_PUBLIC_AWS_USER_POOL_ID=...
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=...
# Only for the Cognito Hosted UI (OIDC)
NEXT_PUBLIC_COGNITO_DOMAIN=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Build & Deploy

```bash
npm run build
npm run start
```

Deployed via AWS Amplify (see `amplify.yml`). Build uses `npm ci --legacy-peer-deps` to bypass the React 19 / xstate peer mismatch.

## Conventions

- **No business logic in UI components** — contexts handle API calls and state, components render and dispatch
- **Mobile-first responsive** — breakpoints `sm:` (640) `md:` (768) `lg:` (1024) `xl:` (1280)
- **Tone palette** — `indigo` primary, `emerald` for success/active, `amber` for warning, `rose` for danger, `slate` for neutral
- **Hairline borders** — `border-slate-100` on cards, `border-slate-200` on inputs
- **No gradients** on app surfaces (per design system) — solid color blocks + hairlines for depth
- **Toasts**, not `window.confirm()`, for all mutation feedback
- **Skeleton loaders**, not spinners, for async data fetches
- **ErrorBoundary** wraps `[id]` detail routes
