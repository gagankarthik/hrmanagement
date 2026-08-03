import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfigured, getSession, sessionHasAppAccess, type Session } from './session';

/**
 * Route-handler authorization.
 *
 * Every `/api/*` handler starts with:
 *
 * ```ts
 * const auth = await authorize(request, 'full');
 * if (!auth.ok) return auth.response;
 * ```
 *
 * Levels:
 *  - `user`  — any signed-in account with an app role (includes self-service).
 *              Handlers at this level MUST scope what they return to the caller.
 *  - `full`  — admin / hr. The default for anything that manages company records.
 *  - `admin` — admin only (Cognito user management, backups).
 */

export type AccessLevel = 'user' | 'full' | 'admin';

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

function deny(error: string, status: number): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status }) };
}

export async function authorize(request: NextRequest, level: AccessLevel = 'full'): Promise<AuthResult> {
  // Missing Cognito configuration must fail closed. An unconfigured deploy that
  // served data anyway is exactly the hole this module exists to close.
  if (!authConfigured) {
    return deny('Authentication is not configured on this server.', 503);
  }

  const session = await getSession(request);
  if (!session) return deny('Sign in required.', 401);
  if (!sessionHasAppAccess(session)) return deny('Your account does not have access to this portal.', 403);

  if (level === 'admin' && !session.admin) return deny('Administrator access is required.', 403);
  if (level === 'full' && !session.fullAccess) return deny('You do not have access to this resource.', 403);

  return { ok: true, session };
}

/** 403 with a consistent message, for per-record ownership checks inside handlers. */
export function forbidden(error = 'You do not have access to this resource.'): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 403 });
}
