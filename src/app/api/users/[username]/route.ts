import { NextRequest, NextResponse } from 'next/server';
import { deleteUser } from '@/lib/cognito';

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
