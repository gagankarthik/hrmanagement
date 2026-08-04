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
 * Who a person is to the business, which is a different question from what they
 * can do in this portal.
 *
 * **Internal staff** (admin, hr, recruiter, sales) work for Ocean Blue itself.
 * They are the people the company website is built for, and they hold accounts
 * in both places.
 *
 * **External workforce** (employee) are the people placed with clients. They
 * exist in this portal only: their own leave, attendance, documents and the
 * handbook. They are NOT company-website users, and an `employee` account is
 * never granted a website role.
 *
 * The portal enforces its half of that by only ever writing `hr:*` groups (see
 * {@link groupNameForRole}), so an employee account carries nothing the website
 * would recognize. The other half has to be enforced on the website, which must
 * require one of ITS OWN roles rather than accepting any authenticated user
 * from the shared pool.
 */
export const INTERNAL_ROLES = ['admin', 'hr', 'recruiter', 'sales'] as const;
export const EXTERNAL_ROLES = ['employee'] as const;

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
 * Roles an admin may assign from the Users page, in display order. Each maps to
 * a namespaced Cognito group (`hr:admin`, see {@link groupNameForRole}) in the
 * `cognito:groups` claim the portal reads for access tiers. `employee` is the
 * invite-only ESS default.
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

/**
 * Per-app group namespace.
 *
 * One Cognito pool serves this HR portal and the company website, so a bare
 * group called `admin` is ambiguous the moment a third application appears:
 * whose admin? New assignments are written as `hr:admin`, `hr:recruiter` and so
 * on, which says which application the role is about.
 *
 * Reads accept both forms. Bare names are the legacy shape and still grant
 * access, so nobody is locked out by the rename; a group carrying a *different*
 * app's prefix (`web:editor`) is deliberately ignored here, because it says
 * nothing about what this portal should allow.
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

/** True if the user holds an admin role (admin-only surfaces such as backups). */
export function isAdmin(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, ADMIN_ROLES);
}

/** True for Ocean Blue's own staff (admin / hr / recruiter / sales). */
export function isInternalStaff(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, INTERNAL_ROLES);
}

/**
 * True for the placed workforce: an `employee` account with no internal role.
 * These people belong to this portal only and must not reach the company site.
 */
export function isExternalWorkforce(roles: ReadonlyArray<string> | null | undefined): boolean {
  return hasAnyRole(roles, EXTERNAL_ROLES) && !isInternalStaff(roles);
}

/** How a single role reads to a human: staff or placed workforce. */
export function roleScope(role: AppRole | null | undefined): 'internal' | 'external' | null {
  if (!role) return null;
  return (INTERNAL_ROLES as ReadonlyArray<string>).includes(role) ? 'internal' : 'external';
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
