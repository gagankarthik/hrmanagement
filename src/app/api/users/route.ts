import { NextRequest, NextResponse } from 'next/server';
import { listUsers, inviteUser } from '@/lib/cognito';

// GET - list all app users (Cognito)
export async function GET() {
  try {
    const data = await listUsers();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list users' },
      { status: 500 },
    );
  }
}

// POST - invite a user (creates the Cognito account; Cognito emails the temp password)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 });
    }
    const data = await inviteUser({ email, name: body.name, resend: !!body.resend });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error inviting user:', error);
    const name = error instanceof Error ? error.name : '';
    let message = error instanceof Error ? error.message : 'Failed to invite user';
    if (name === 'UsernameExistsException') message = 'A user with that email already exists.';
    if (name === 'AccessDeniedException' || name === 'NotAuthorizedException') {
      message = 'The server is not authorized to manage Cognito users (missing cognito-idp:AdminCreateUser permission).';
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
