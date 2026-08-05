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

/** True when `username` identifies the caller themselves. */
export function isSelf(session: Session, username: string): boolean {
  const target = username.trim().toLowerCase();
  if (!target) return false;
  return [session.username, session.userId, session.email]
    .filter(Boolean)
    .some((id) => id!.trim().toLowerCase() === target);
}

/**
 * Guard an hr user changing their OWN role.
 *
 * Nobody should be able to rewrite their own level of access, and HR sits close
 * enough to the controls that the temptation is real: without this they could
 * quietly hand themselves a different role and the audit trail would show them
 * doing it to a user who happens to be them. An admin is deliberately exempt —
 * someone has to be able to hand over, and there is no higher role to appeal
 * to.
 */
export function denySelfRoleChange(session: Session, username: string): NextResponse | null {
  if (session.admin || !isSelf(session, username)) return null;
  return refuse('You cannot change your own role. Ask an administrator.');
}
