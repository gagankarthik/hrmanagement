import 'server-only';
import { NextResponse } from 'next/server';
import { FULL_ACCESS_ROLES, type AppRole } from '@/config/access';
import { groupRoleFor } from '@/lib/cognito';
import type { Session } from './session';

/**
 * Who may hand out which role.
 *
 * HR runs account administration day to day: inviting people, linking their
 * sign-in to an employee record, blocking access when someone leaves. What HR
 * cannot do is manufacture full access — creating an admin or hr account, or
 * editing an existing one, stays with admins. Without that line, "manage
 * accounts" quietly means "grant yourself anything".
 */

/** Roles that confer full access to the whole portal. */
const ELEVATED: readonly string[] = FULL_ACCESS_ROLES;

export function isElevatedRole(role: string | null | undefined): boolean {
  return Boolean(role && ELEVATED.includes(role.toLowerCase().trim()));
}

function refuse(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Guard an attempt to assign `role`. Returns a 403 response when the caller is
 * reaching above their own level, otherwise null.
 */
export function denyRoleEscalation(session: Session, role: AppRole | string | null | undefined): NextResponse | null {
  if (!isElevatedRole(role) || session.admin) return null;
  return refuse('Only an administrator can grant HR or Admin access.');
}

/**
 * Guard an attempt to modify an existing account. An hr user must not be able
 * to demote, block or delete an admin. Looks the target's live group up rather
 * than trusting anything in the request.
 */
export async function denyElevatedTarget(session: Session, username: string): Promise<NextResponse | null> {
  if (session.admin) return null;
  const role = await groupRoleFor(username);
  if (!isElevatedRole(role)) return null;
  return refuse('Only an administrator can change an HR or Admin account.');
}
