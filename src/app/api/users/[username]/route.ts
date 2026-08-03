import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/shared/server/auth/guards';
import { denyElevatedTarget, denyRoleEscalation } from '@/shared/server/auth/role-limits';
import {
  deleteUser,
  updateUserMeta,
  setUserRole,
  APP_INVITE_ROLES,
  type AppRole,
} from '@/lib/cognito';

// PATCH - update HR-portal metadata (role, portal access)
export async function PATCH(request: NextRequest,
  { params }: { params: Promise<{ username: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { username } = await params;
    const body = await request.json();

    const meta: { hrAccess?: boolean } = {};
    if ('hrAccess' in body) {
      meta.hrAccess = !!body.hrAccess;
    }

    const uname = decodeURIComponent(username);

    // An hr user administers ordinary accounts, not admin/hr ones — in either
    // direction: they cannot touch an elevated account, nor promote into one.
    const protectedTarget = await denyElevatedTarget(auth.session, uname);
    if (protectedTarget) return protectedTarget;

    // Role change is a group operation (not just an attribute), handled separately.
    if ('role' in body) {
      const rawRole = (body.role || '').toLowerCase().trim();
      if (!APP_INVITE_ROLES.includes(rawRole as AppRole)) {
        return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
      }
      const escalation = denyRoleEscalation(auth.session, rawRole);
      if (escalation) return escalation;
      await setUserRole(uname, rawRole as AppRole);
    }

    // hrAccess attribute update (skip a no-op call if only the role changed).
    if (Object.keys(meta).length > 0) {
      await updateUserMeta(uname, meta);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    const name = error instanceof Error ? error.name : '';
    let message = error instanceof Error ? error.message : 'Failed to update user';
    if (name === 'AccessDeniedException' || name === 'NotAuthorizedException') {
      message = 'The server is not authorized to manage Cognito users (missing cognito-idp:AdminUpdateUserAttributes / AddCustomAttributes / AdminAddUserToGroup permission).';
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE - remove a user from the pool
export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ username: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { username } = await params;
    const uname = decodeURIComponent(username);

    const protectedTarget = await denyElevatedTarget(auth.session, uname);
    if (protectedTarget) return protectedTarget;

    await deleteUser(uname);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    const name = error instanceof Error ? error.name : '';
    let message = error instanceof Error ? error.message : 'Failed to delete user';
    if (name === 'AccessDeniedException' || name === 'NotAuthorizedException') {
      message = 'The server is not authorized to manage Cognito users (missing cognito-idp:AdminDeleteUser permission).';
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
