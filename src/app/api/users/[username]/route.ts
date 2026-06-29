import { NextRequest, NextResponse } from 'next/server';
import { deleteUser, updateUserMeta, USER_EMPLOYEE_TYPES, type UserEmployeeType } from '@/lib/cognito';

// PATCH - update HR-portal metadata (employee type, portal access)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const body = await request.json();

    const meta: { employeeType?: UserEmployeeType | null; hrAccess?: boolean } = {};
    if ('employeeType' in body) {
      const t = body.employeeType;
      if (t !== null && t !== '' && !USER_EMPLOYEE_TYPES.includes(t)) {
        return NextResponse.json({ success: false, error: 'Invalid employee type' }, { status: 400 });
      }
      meta.employeeType = t === '' ? null : (t as UserEmployeeType | null);
    }
    if ('hrAccess' in body) {
      meta.hrAccess = !!body.hrAccess;
    }

    await updateUserMeta(decodeURIComponent(username), meta);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    const name = error instanceof Error ? error.name : '';
    let message = error instanceof Error ? error.message : 'Failed to update user';
    if (name === 'AccessDeniedException' || name === 'NotAuthorizedException') {
      message = 'The server is not authorized to manage Cognito users (missing cognito-idp:AdminUpdateUserAttributes / AddCustomAttributes permission).';
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE - remove a user from the pool
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    await deleteUser(decodeURIComponent(username));
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
