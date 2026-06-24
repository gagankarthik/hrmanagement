import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { hasAppAccess } from '@/config/access';

/**
 * Server-side security boundary for the HR API.
 *
 * Every `/api/*` request must carry a valid Cognito **ID token** (stored in a
 * cookie by Amplify — see src/config/amplify.ts). The middleware:
 *   1. Verifies the JWT signature against the pool's JWKS, plus issuer,
 *      audience (app client), token_use, and expiry (jose enforces exp/nbf).
 *   2. Authorizes by role — only admin/HR (see src/config/access.ts) may call
 *      the API. Authenticated-but-unauthorized → 403; missing/invalid → 401.
 *
 * This is the real boundary: the client-side ProtectedRoute only controls the
 * UI. Even a direct API call with no/forged token is rejected here.
 */

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || '';
const USER_POOL_ID = process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '';
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

// Cached across invocations on a warm instance; fetched lazily on first use.
const JWKS = USER_POOL_ID
  ? createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`))
  : null;

function deny(status: 401 | 403 | 500, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Pull the Cognito ID token from the Amplify-written cookies. */
function readIdToken(req: NextRequest): string | undefined {
  const cookies = req.cookies.getAll();
  // Amplify name: CognitoIdentityServiceProvider.<clientId>.<user>.idToken
  const match =
    cookies.find((c) => c.name.includes(`.${CLIENT_ID}.`) && c.name.endsWith('.idToken')) ||
    cookies.find((c) => c.name.endsWith('.idToken'));
  return match?.value;
}

function rolesFromClaims(payload: JWTPayload): string[] {
  const groups = payload['cognito:groups'];
  const customRole = payload['custom:role'];
  const list: string[] = [];
  if (Array.isArray(groups)) list.push(...groups.map(String));
  if (typeof customRole === 'string') list.push(customRole);
  return list.map((r) => r.toLowerCase().trim()).filter(Boolean);
}

export async function proxy(req: NextRequest) {
  if (!JWKS || !USER_POOL_ID || !CLIENT_ID) {
    return deny(500, 'Authentication is not configured on the server.');
  }

  const token = readIdToken(req);
  if (!token) return deny(401, 'Authentication required.');

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, { issuer: ISSUER, audience: CLIENT_ID }));
  } catch {
    return deny(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  // Cognito ID tokens carry token_use === 'id'.
  if (payload.token_use !== 'id') return deny(401, 'Invalid token.');

  if (!hasAppAccess(rolesFromClaims(payload))) {
    return deny(403, 'You do not have permission to perform this action.');
  }

  return NextResponse.next();
}

// Guard the whole API surface. (Pages are gated client-side by ProtectedRoute;
// the API is the hard data boundary.)
export const config = {
  matcher: ['/api/:path*'],
};
