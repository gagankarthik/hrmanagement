# Design System — Ocean Blue Workforce Platform

The single source of truth for how the UI looks and behaves. The goal is that every
screen reads as part of one family. When building new UI, reuse the primitives named
here. Do not hand-roll a second version of something that already exists.

> Writing rule: no em dashes in user-facing copy. Use commas, colons, or parentheses.

---

## 1. Foundations (tokens)

Tokens live in `src/app/globals.css` (`@theme`). Never hardcode a hex that a token
already covers.

### Color

**Brand (cobalt), the only primary.** Use `brand-600` for primary actions.
`50 #eff4ff · 100 #dbe6fe · 200 #bfd3fe · 300 #93b4fd · 400 #6090fa · 500 #3b6cf6 · 600 #1d4ed8 · 700 #1740ad · 800 #183a8a · 900 #0e2147 · 950 #0a1730`

**Accent (cyan), marketing only.** `accent-400 #2ad8ef`, `accent-500 #14bfe0`. Reserved
for landing/auth CTAs (`.btn-accent`). Never use accent for an in-app primary action.

**Semantic (fixed meanings).**
- Success: `emerald-600` text on `emerald-50/100`.
- Warning: `amber-600` on `amber-50/100`.
- Danger: `red-600` on `red-50/100`.
- Info: `brand-600` on `brand-50/100`.

**Neutrals.** App canvas `#f8fafc`. Card `white`. Border `#e2e8f0` (`slate-200`).
Text hierarchy: primary `slate-900`, secondary `slate-600`, tertiary `slate-500`.
**`slate-400` is decoration only** (icons, empty dashes, placeholders). Never render
meaningful data text below `slate-500` on white (contrast floor).

**Contrast (WCAG 2.1 AA).** `slate-600/700/900` on white pass AA for body text.
`slate-500` passes for normal text, so it is the floor for real data. `.btn-primary`
(white on `#1d4ed8`) and `.btn-accent` (`#0a1730` on `#2ad8ef`) both pass. Never encode
state by color alone: pair every color with an icon or text (status badges already do).

### Typography

Geist Sans everywhere (body and headings via `font-display`, letter-spacing -0.02em).
Geist Mono for code. Root is 15px; use rem-based Tailwind sizes.
- Page title (H1): `font-display text-2xl font-bold` (`sm:text-2xl`), `text-slate-900`.
- Section title (H2): `font-display text-base font-bold`.
- Body: `text-sm` (14px) `text-slate-600`.
- Label / eyebrow: `text-[11px] font-semibold uppercase tracking-wider`, use `.eyebrow`.
- Metric value: `font-display`, `tabular-nums`/`.tnum`, always `truncate`.

### Spacing and layout

4px base. Approved steps: 4, 8, 12, 16, 24, 32, 48, 64.
- Between top-level page blocks: `space-y-6` (via `PageContainer`, use it on every page).
- Grids of cards/charts: `gap-4`.
- Card interior padding: `p-5` (`sm:p-6` for forms).
- Max content width 1360px, set by the dashboard layout. Do not set your own.

### Radius, elevation, motion

- Radius: controls `rounded-lg` (10px), cards `rounded-2xl`, pills `rounded-full`.
- Elevation: use the `.surface` class for every card (border + soft navy-tinted shadow).
  `.surface-hover` adds the lift on interactive cards. Do not invent new box-shadows.
- Motion: 150 to 200ms transitions; entrances via `animate-in fade-in slide-in-from-*`.
  `prefers-reduced-motion` is globally respected in `globals.css`. Never rely on motion
  to convey meaning.

### Iconography

Lucide only. Size `h-4 w-4` inline / `h-5 w-5` in tiles. `strokeWidth={1.75}`.
Color: `slate-400` decorative, `slate-600` interactive, tone color inside status chips.

---

## 2. Component standards (one primitive per job)

Reuse the left column. If you need a variant, extend the primitive, do not fork it.

| Job | Use this | Notes |
|---|---|---|
| Primary action | `.btn-primary` | cobalt pill; one primary per view |
| Secondary action | `.btn-ghost` | outlined pill |
| Marketing CTA | `.btn-accent` | cyan; landing/auth only |
| Loading button | `Button` (`components/ui/button.tsx`) | wraps `.btn-*`, adds `aria-busy` |
| Page shell | `PageContainer` + `PageHeader` | every page, no exceptions |
| Metric card | `StatCard` / `StatGrid` | the standard KPI/stat surface |
| Rich dashboard KPI | `KpiCard` | sanctioned dashboard-only variant (tooltip, ring, delta) |
| Compact stat cell | `SummaryStat` (reports) | a cell inside a card, not a card itself |
| Tabs | `Tabs` (`components/ui/tabs.tsx`) | accessible underline, arrow-key nav |
| Single-select filter | `FilterSelect` (`components/ui/filter-select.tsx`) | styled native select |
| Table / list | `DataTable` | sorting, column show/hide, empty/error/loading, keyboard rows |
| Confirm / destructive | `ConfirmDialog` | focus-trapped, `reassurance` slot |
| Row actions | `ActionMenu` | |
| Status | `StatusBadge` | color + icon + text, never color alone |
| Empty state | `EmptyState` | icon + title + description + action |
| Loading | `Skeleton` / `SkeletonTable` | match the final layout, not a bare spinner |
| Toast | `useToast` | transient feedback; errors via `friendlyError()` |
| Form field | `FormField` (`components/ui/form-field.tsx`) | label + control + error + aria |
| Toggle | `Switch` | has focus-visible ring |

### Button states and sizes
Default, hover (darken + subtle lift), active (settle), disabled (`opacity-50`,
`cursor-not-allowed`), focus (`focus-visible:ring-2 ring-brand-200`), loading (spinner +
`aria-busy`). Padding: default `px-5 py-2.5`; compact `px-4 py-2 text-sm`. Destructive uses
`ConfirmDialog` with `tone="danger"` (red), never a bare red button without confirmation.

### Data helpers (mandatory)
- Currency: `money(n, {cents?})` from `lib/format.ts`. Never inline `toLocaleString(currency)`.
- Dates: `formatDate(v)` / `formatDateTime(v)` from `lib/format.ts` (they parse date-only
  strings as local time, which fixes UTC off-by-one on expiry/hire/DOB).
- Errors: `friendlyError(err)` from `lib/errors.ts`. Never show a raw exception message.
- Missing value: render `—` (single dash), consistently.

---

## 3. Layout patterns

- **Dashboard:** KPI strip (max 4 `KpiCard`), then sectioned analytics on one page (no tabs),
  each section under a labelled divider, `gap-4`. Filters are hidden behind a toggle and
  render below the KPIs. No refresh buttons (data loads on mount and after mutations).
- **List / index page:** `PageHeader` (title + primary action), optional `StatGrid`, then a
  `.surface` containing a toolbar (search left, `FilterSelect` dropdowns right) and a
  `DataTable`. Bulk actions appear in the toolbar when rows are selected.
- **Detail page:** `PageHeader` with the record name + an `ActionMenu` of related actions;
  content in `.surface` sections; use `Tabs` for parallel sections, accordion for long forms.
- **Create / edit form:** single column by default, two columns only for short paired fields;
  section headers group fields; validation shows inline under the field; Save (primary) and
  Cancel (ghost) are bottom-right; disable Save while submitting and show the button spinner.

---

## 4. Interaction and accessibility rules

- **Keyboard:** every interactive element is reachable and operable by keyboard with a
  visible `focus-visible` ring. Table rows that navigate use `role="button"` + Enter/Space.
  Tabs support arrow keys. Modals trap focus, close on Escape, and restore focus on close.
- **Screen readers:** icon-only buttons have `aria-label`. Tables have an sr-only `<caption>`,
  `scope="col"`, and `aria-sort`. Form controls associate label via `htmlFor`/`id` and set
  `aria-invalid` + `aria-describedby` on error.
- **States, always four:** loading (skeleton matching layout), empty (`EmptyState`),
  error + retry (`DataTable` `error`/`onRetry`, never show empty on failure), and success.
- **Feedback:** success and recoverable errors use toasts; field validation is inline; a
  full-section failure uses the error state; destructive actions confirm and reassure what is
  retained.
- **Reduced motion and color blindness:** honored globally; never signal via color alone.

---

## 5. Responsive

- Desktop (1200px+): full sidebar, multi-column grids, all table columns.
- Tablet (768 to 1199px): sidebar collapsible; grids drop to 2 up; secondary table columns
  hide via `DataTable` `hideBelow`.
- Mobile (320 to 767px): sidebar becomes a drawer; single-column stacks; tables scroll inside
  their own container; primary action stays reachable. Use relative units, never fixed px
  widths that cannot collapse.

---

## 6. Do not

- Do not create a second button, tab, stat, modal, or filter style. Extend the primitive.
- Do not format currency or dates inline. Use `money` / `formatDate`.
- Do not surface raw error strings. Use `friendlyError`.
- Do not render meaningful text below `slate-500` on white.
- Do not use the cyan accent for in-app primary actions.
- Do not use em dashes in copy.
