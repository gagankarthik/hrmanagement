import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, DollarSign, ShieldCheck, Users } from 'lucide-react';
import type { AppRole } from '@/config/access';

/**
 * Dashboard view configuration — the single source of truth for the
 * Overview / Financial / Compliance / Workforce tab switcher and which roles
 * may see each view. Financial is admin-only (margins, A/R, billing are hidden
 * from HR); everything else is visible to any role with app access.
 */
export type DashboardView = 'overview' | 'financial' | 'compliance' | 'workforce';

export interface DashboardViewDef {
  key: DashboardView;
  label: string;
  icon: LucideIcon;
  /** If set, only these roles see the tab. Undefined = visible to all. */
  roles?: AppRole[];
}

export const DASHBOARD_VIEWS: DashboardViewDef[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'financial', label: 'Financial', icon: DollarSign, roles: ['admin'] },
  { key: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { key: 'workforce', label: 'Workforce', icon: Users },
];

/** True when the user's roles satisfy an optional allow-list. */
export function hasRole(userRoles: ReadonlyArray<string>, allowed?: AppRole[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  const owned = new Set(userRoles.map((r) => r.toLowerCase().trim()));
  return allowed.some((r) => owned.has(r));
}

/** The views the given user may see, in declared order. */
export function visibleViews(userRoles: ReadonlyArray<string>): DashboardViewDef[] {
  return DASHBOARD_VIEWS.filter((v) => hasRole(userRoles, v.roles));
}

/** Convenience: is this user an admin (sees financials)? */
export function isAdminRole(userRoles: ReadonlyArray<string>): boolean {
  return userRoles.some((r) => r.toLowerCase().trim() === 'admin');
}
