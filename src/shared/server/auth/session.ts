import 'server-only';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { NextRequest } from 'next/server';
import { hasAppAccess, hasFullAccess, isAdmin, isSelfServiceOnly } from '@/config/access';

/**
 * Server-side session verification.
 *
 * The browser holds its Cognito tokens in cookies (see src/config/amplify.ts),
 * so every same-origin `/api/*` call already carries them. This module is the
 * only place that turns those bytes into a trusted identity: the JWT is
 * cryptographically verified against the User Pool's public JWKS, so nothing a
 * caller can forge client-side is believed. Roles come from the verified
 * `cognito:groups` claim, never from the request body.
 *
 * Verification is the authority for API access. Client-side route guards
 * (ProtectedRoute) are only a UX nicety; they can be bypassed trivially.
 */

const REGION =
  process.env.COGNITO_REGION ||
  process.env.APP_AWS_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-2';

const USER_POOL_ID =
  process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || '';

const CLIENT_ID =
  process.env.COGNITO_USER_POOL_CLIENT_ID || process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '';

/** False when the pool/client env vars are missing — the API then denies everything. */
export const authConfigured = Boolean(USER_POOL_ID && CLIENT_ID);

const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

// Lazily built and cached for the lifetime of the server process; the jose
// remote key set handles its own key rotation and caching.
let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;
function jwks() {
  if (!keySet) keySet = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));
  return keySet;
}

export interface Session {
  /** Cognito `sub` — the stable user id. */
  userId: string;
  username: string;
  /** Lowercased login email, or '' when the token carries none. */
  email: string;
  name?: string;
  /** Verified Cognito groups (plus `custom:role`), lowercased. */
  roles: string[];
  /** False only when an admin set `custom:hr_access` to "false". */
  hrAccess: boolean;
  /** admin or hr. */
  fullAccess: boolean;
  admin: boolean;
  /** Holds an app role, but not a full-access one (recruiter / sales / employee). */
  selfServiceOnly: boolean;
}

/**
 * Pull a JWT off the request: an explicit bearer token wins, otherwise the
 * Amplify cookie. Cookie names look like
 * `CognitoIdentityServiceProvider.<clientId>.<username>.idToken`.
 */
function readToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }

  const cookies = request.cookies.getAll();
  const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}.`;
  const idToken = cookies.find((c) => c.name.startsWith(prefix) && c.name.endsWith('.idToken'));
  if (idToken?.value) return idToken.value;
  // An access token still proves identity + group membership; it just lacks email.
  const accessToken = cookies.find((c) => c.name.startsWith(prefix) && c.name.endsWith('.accessToken'));
  return accessToken?.value || null;
}

function claimList(payload: JWTPayload, key: string): string[] {
  const raw = payload[key];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) return [raw];
  return [];
}

function toSession(payload: JWTPayload): Session {
  const roles = Array.from(
    new Set(
      [...claimList(payload, 'cognito:groups'), ...claimList(payload, 'custom:role')]
        .map((r) => r.toLowerCase().trim())
        .filter(Boolean),
    ),
  );
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '';
  return {
    userId: String(payload.sub || ''),
    username: String(payload['cognito:username'] || payload.username || payload.sub || ''),
    email,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    hrAccess: payload['custom:hr_access'] !== 'false',
    roles,
    fullAccess: hasFullAccess(roles),
    admin: isAdmin(roles),
    selfServiceOnly: isSelfServiceOnly(roles),
  };
}

/**
 * Verify the caller's token and return their session, or null when the request
 * carries no valid, unexpired token for this User Pool and app client.
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  if (!authConfigured) return null;
  const token = readToken(request);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwks(), { issuer: ISSUER });
    // Bind the token to this app client. ID tokens carry `aud`; access tokens
    // carry `client_id`. Anything else (or a token minted for another app) is
    // rejected rather than trusted.
    const tokenUse = payload.token_use;
    if (tokenUse === 'id') {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(CLIENT_ID)) return null;
    } else if (tokenUse === 'access') {
      if (payload.client_id !== CLIENT_ID) return null;
    } else {
      return null;
    }
    if (!payload.sub) return null;
    return toSession(payload);
  } catch {
    // Bad signature, expired, malformed — all the same answer to the caller.
    return null;
  }
}

/** True when the session may use the application at all. */
export function sessionHasAppAccess(session: Session): boolean {
  return hasAppAccess(session.roles) && session.hrAccess;
}
