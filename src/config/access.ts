/**
 * Application access policy — single source of truth for which roles may use the
 * HR portal and at what level.
 *
 * Roles in the Ocean Blue Cognito pool: admin, hr, recruiter, sales, employee.
 *
 * Two access tiers:
 *  - **Full access** (admin, hr): the entire HR portal.
 *  - **Self-service** (recruiter, sales, employee): a limited ESS portal — view
 *    company handbook / procedures / policies / benefits, view their own
 *    documents / payslips, and apply for / view their own leave. They cannot
 *    manage records or see other employees' data.
 *
 * To grant another role a tier later, just add it to the relevant list.
 *
 * Site boundary: this policy governs the HR portal ONLY. `employee` users are
 * invite-only into this platform; the OceanBlue marketing site shares the same
 * Cognito pool, so it must exclude the `employee` group on its own side — that
 * separation cannot be enforced from this codebase.
 */
export const FULL_ACCESS_ROLES = ['admin', 'hr'] as const;
export const SELF_SERVICE_ROLES = ['recruiter', 'sales', 'employee'] as const;

/**
 * Roles allowed to reach admin-only surfaces (e.g. data backups). Stricter than
 * full-access: `hr` can run the HR portal but only `admin` may export/restore
 * data. Add roles here to widen that gate.
 */
export const ADMIN_ROLES = ['admin'] as const;

/** Every role allowed to authenticate into the app (any tier). */
export const APP_ACCESS_ROLES = [...FULL_ACCESS_ROLES, ...SELF_SERVICE_ROLES] as const;

export type AppRole = (typeof APP_ACCESS_ROLES)[number];

/**
 * Roles an admin may assign from the Users page, in display order. Each maps 1:1
 * to a Cognito group of the same name (the `cognito:groups` claim the portal
 * reads for access tiers). `employee` is the invite-only ESS default.
 * Client-safe (plain constants) so both the Users UI and the server share one source.
 */
export const INVITE_ROLE_OPTIONS = ['employee', 'recruiter', 'sales', 'hr', 'admin'] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  employee: 'Employee (ESS)',
  recruiter: 'Recruiter',
  sales: 'Sales',
  hr: 'HR',
  admin: 'Admin',
};

/** Normalize a raw role/group string for comparison. */
function norm(role: string): string {
  return role.toLowerCase().trim();
}

function hasAnyRole(roles: ReadonlyArray<string> | null | undefined, allowed: ReadonlyArray<string>): boolean {
  if (!roles || roles.length === 0) return false;
  const owned = new Set(roles.map(norm));
  return allowed.some((r) => owned.has(r));
}

/** True if any of the user's roles is allowed to use the application at all. */
export function hasAppAccess(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, APP_ACCESS_ROLES);
}

/** True if the user has full HR-portal access (admin / hr). */
export function hasFullAccess(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, FULL_ACCESS_ROLES);
}

/** True if the user holds an admin role (admin-only surfaces such as backups). */
export function isAdmin(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, ADMIN_ROLES);
}

/**
 * True if the user may use the app but only at the self-service tier — i.e. they
 * hold a self-service role and do NOT hold a full-access role. (An admin who is
 * also tagged `sales` still gets the full portal.)
 */
export function isSelfServiceOnly(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAppAccess(roles) && !hasFullAccess(roles);
}

/**
 * Roles ordered by seniority — used to pick the single role to show a user
 * when they hold more than one (e.g. an admin also tagged `sales`).
 */
const ROLE_PRECEDENCE: readonly AppRole[] = ['admin', 'hr', 'recruiter', 'sales', 'employee'];

/**
 * The one role to display for a user, most senior first. Returns `null` when
 * they hold no recognized application role.
 */
export function primaryRole(roles: ReadonlyArray<string> | null | undefined): AppRole | null {
  if (!roles || roles.length === 0) return null;
  const owned = new Set(roles.map(norm));
  return ROLE_PRECEDENCE.find((r) => owned.has(r)) ?? null;
}

/** Display label for a user's primary role, e.g. "Employee (ESS)". */
export function primaryRoleLabel(roles: ReadonlyArray<string> | null | undefined): string {
  const role = primaryRole(roles);
  return role ? ROLE_LABELS[role] : 'No role assigned';
}

/**
 * Route prefixes a self-service user is allowed to visit. Anything else is
 * redirected to {@link SELF_SERVICE_HOME}. Prefix match, so child routes
 * (e.g. `/my-leave/new`) are covered.
 */
export const SELF_SERVICE_ROUTES = [
  '/handbook',
  '/procedures',
  '/policies',
  '/benefits',
  '/my-leave',
  '/my-attendance',
  '/my-documents',
  '/profile',
] as const;

/** Where a self-service user lands by default / after a blocked navigation. */
export const SELF_SERVICE_HOME = '/handbook';

/** True if the given path is within the self-service allow-list. */
export function isSelfServiceRouteAllowed(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const inList = SELF_SERVICE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (!inList) return false;
  // Self-service users get read-only access except for filing their own leave —
  // block every other create/edit screen (e.g. /benefits/new, /benefits/x/edit).
  const isManageScreen = /\/(new|edit)$/.test(pathname);
  if (isManageScreen && !pathname.startsWith('/my-leave')) return false;
  return true;
}
