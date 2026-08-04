import 'server-only';
import { ADMIN_ROLES, type AppRole } from '@/config/access';
import { NextResponse } from 'next/server';
import { groupRoleFor } from '@/lib/cognito';
import type { Session } from './session';

/**
 * The one line HR does not cross.
 *
 * HR and admin are peers across the portal: HR invites people, assigns roles,
 * links sign-ins to employee records, and blocks access when someone leaves.
 * HR manages every employee and every other HR account.
 *
 * Admin accounts are the exception. An hr user cannot demote, block, delete or
 * otherwise edit an admin, and cannot grant the admin role to anyone including
 * themselves. Without that line, "manage accounts" quietly means "promote
 * yourself", and the distinction between the two roles evaporates the first
 * time an HR account is phished.
 *
 * Note this is deliberately narrower than it used to be: HR may now act on hr
 * accounts. Admin is the only protected target.
 */

/** Roles an hr user may neither grant nor act upon. */
const PROTECTED: readonly string[] = ADMIN_ROLES;

export function isProtectedRole(role: string | null | undefined): boolean {
  return Boolean(role && PROTECTED.includes(role.toLowerCase().trim()));
}

function refuse(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Guard an attempt to assign `role`. Returns a 403 response when the caller is
 * reaching above their own level, otherwise null.
 */
export function denyRoleEscalation(session: Session, role: AppRole | string | null | undefined): NextResponse | null {
  if (!isProtectedRole(role) || session.admin) return null;
  return refuse('Only an administrator can grant Admin access.');
}

/**
 * Guard an attempt to modify an existing account. An hr user must not be able
 * to demote, block or delete an admin. Looks the target's live group up rather
 * than trusting anything in the request.
 */
export async function denyElevatedTarget(session: Session, username: string): Promise<NextResponse | null> {
  if (session.admin) return null;
  const role = await groupRoleFor(username);
  if (!isProtectedRole(role)) return null;
  return refuse('Only an administrator can change an Admin account.');
}
