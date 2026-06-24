/**
 * Application access policy — single source of truth for which roles may use the
 * HR portal.
 *
 * Roles in the Ocean Blue Cognito pool: admin, hr, recruiter, sales.
 * For now only **admin** and **hr** may enter the application. Recruiter and
 * sales are authenticated but not authorized, and see an "access restricted"
 * screen instead of the dashboard.
 *
 * To grant another role access later, just add it here.
 */
export const APP_ACCESS_ROLES = ['admin', 'hr'] as const;

export type AppRole = (typeof APP_ACCESS_ROLES)[number];

/** Normalize a raw role/group string for comparison. */
function norm(role: string): string {
  return role.toLowerCase().trim();
}

/** True if any of the user's roles is allowed to use the application. */
export function hasAppAccess(roles: ReadonlyArray<string> | null | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  const owned = new Set(roles.map(norm));
  return APP_ACCESS_ROLES.some((r) => owned.has(r));
}
