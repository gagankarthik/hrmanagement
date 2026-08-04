/**
 * Application access policy — single source of truth for which roles may use the
 * HR portal and at what level.
 *
 * Roles in the HR Cognito pool: admin, hr, employee. That is the whole list.
 *
 * Two access tiers:
 *  - **Full access** (admin, hr): the entire HR portal.
 *  - **Self-service** (employee): a limited ESS portal — view company handbook /
 *    procedures / policies / benefits, view their own documents / payslips, and
 *    apply for / view their own leave. They cannot manage records or see other
 *    employees' data.
 *
 * To grant another role a tier later, just add it to the relevant list.
 *
 * Site boundary: this portal runs on its OWN Cognito user pool, separate from
 * the company website. An account here does not exist over there, which is what
 * keeps placed workforce and candidates off the public site. Nothing in this
 * codebase should ever be pointed back at the website's pool.
 */
export const FULL_ACCESS_ROLES = ['admin', 'hr'] as const;
export const SELF_SERVICE_ROLES = ['employee'] as const;

/**
 * Roles allowed to reach the few admin-only surfaces.
 *
 * HR and admin are peers almost everywhere: HR runs the portal, manages every
 * employee, and manages other HR accounts. Two things are held back, and both
 * are about destroying something rather than doing HR work:
 *
 *  1. Deleting a data backup ({@link ADMIN_ROLES}, DELETE /api/admin/backups).
 *     HR can list and create backups, which is the recoverable half.
 *  2. Anything targeting an admin account, or granting the admin role. That
 *     boundary lives in `shared/server/auth/role-limits.ts`, because it depends
 *     on the target rather than the route.
 *
 * Add roles here to widen the first gate.
 */
export const ADMIN_ROLES = ['admin'] as const;

/** Every role allowed to authenticate into the app (any tier). */
export const APP_ACCESS_ROLES = [...FULL_ACCESS_ROLES, ...SELF_SERVICE_ROLES] as const;

export type AppRole = (typeof APP_ACCESS_ROLES)[number];

/**
 * Roles an admin may assign from the Users page, in display order. Each maps to
 * a namespaced Cognito group (`hr:admin`, see {@link groupNameForRole}) in the
 * `cognito:groups` claim the portal reads for access tiers. `employee` is the
 * invite-only ESS default.
 * Client-safe (plain constants) so both the Users UI and the server share one source.
 */
export const INVITE_ROLE_OPTIONS = ['employee', 'hr', 'admin'] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  employee: 'Employee (ESS)',
  hr: 'HR',
  admin: 'Admin',
};

/**
 * Per-app group namespace.
 *
 * This portal now has its own Cognito pool, so the prefix is no longer load
 * bearing for isolation — that job belongs to the pool boundary. It is kept
 * because assignments are already written as `hr:admin`, `hr:employee`, and
 * because it keeps saying which application a role is about if anything else
 * ever shares this pool.
 *
 * Reads accept both forms. Bare names are the legacy shape and still grant
 * access, so nobody is locked out; a group carrying a *different* app's prefix
 * (`web:editor`) is deliberately ignored, because it says nothing about what
 * this portal should allow.
 */
export const APP_ROLE_NAMESPACE = 'hr';
const NAMESPACE_SEPARATOR = ':';

/** The Cognito group name this app writes for a role, e.g. "hr:admin". */
export function groupNameForRole(role: AppRole): string {
  return `${APP_ROLE_NAMESPACE}${NAMESPACE_SEPARATOR}${role}`;
}

/**
 * Turn a raw group / claim string into one of this app's roles.
 * `hr:admin` and `admin` both resolve to `admin`; `web:admin` resolves to null.
 */
export function normalizeRole(raw: string | null | undefined): AppRole | null {
  if (!raw) return null;
  const value = raw.toLowerCase().trim();
  if (!value) return null;

  const sep = value.indexOf(NAMESPACE_SEPARATOR);
  if (sep !== -1) {
    const namespace = value.slice(0, sep);
    const role = value.slice(sep + 1);
    if (namespace !== APP_ROLE_NAMESPACE) return null; // another app's role
    return (APP_ACCESS_ROLES as ReadonlyArray<string>).includes(role) ? (role as AppRole) : null;
  }

  // Legacy unprefixed group.
  return (APP_ACCESS_ROLES as ReadonlyArray<string>).includes(value) ? (value as AppRole) : null;
}

/** Every role in the list that belongs to this app, normalized and deduped. */
export function appRolesOf(roles: ReadonlyArray<string> | null | undefined): AppRole[] {
  if (!roles?.length) return [];
  const out = new Set<AppRole>();
  for (const raw of roles) {
    const role = normalizeRole(raw);
    if (role) out.add(role);
  }
  return [...out];
}

function hasAnyRole(roles: ReadonlyArray<string> | null | undefined, allowed: ReadonlyArray<string>): boolean {
  if (!roles || roles.length === 0) return false;
  const owned = new Set<string>(appRolesOf(roles));
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

/** True if the user holds an admin role (admin-only surfaces such as backup deletion). */
export function isAdmin(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, ADMIN_ROLES);
}

/**
 * True if the user may use the app but only at the self-service tier — i.e. they
 * hold a self-service role and do NOT hold a full-access role. (Someone tagged
 * both `employee` and `hr` still gets the full portal.)
 */
export function isSelfServiceOnly(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAppAccess(roles) && !hasFullAccess(roles);
}

/**
 * Roles ordered by seniority — used to pick the single role to show a user
 * when they hold more than one (e.g. an admin also tagged `employee`).
 */
const ROLE_PRECEDENCE: readonly AppRole[] = ['admin', 'hr', 'employee'];

/**
 * The one role to display for a user, most senior first. Returns `null` when
 * they hold no recognized application role.
 */
export function primaryRole(roles: ReadonlyArray<string> | null | undefined): AppRole | null {
  const owned = new Set<string>(appRolesOf(roles));
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
