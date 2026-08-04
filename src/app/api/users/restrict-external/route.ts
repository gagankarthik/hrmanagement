import { NextRequest } from 'next/server';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';
import { listUsers, setUserRole } from '@/lib/cognito';

/**
 * Normalize external workforce accounts onto the namespaced `hr:employee` group.
 *
 * This was the mitigation for the shared-pool era, when a bare `employee` group
 * was the same shape the company website read and could be honoured over there.
 * The pool split made that impossible: this portal has its own user pool, and an
 * account here does not exist on the website at all.
 *
 * It survives as a tidy-up for accounts migrated in carrying legacy bare groups,
 * so every `employee` ends up on one consistent group name. It only ever
 * rewrites group membership; no account and no record is removed.
 *
 * Idempotent — running it twice changes nothing the second time.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'admin');
  if (!auth.ok) return auth.response;

  try {
    const users = await listUsers();
    const external = users.filter((u) => u.role === 'employee');

    const restricted: string[] = [];
    const failed: { email: string; error: string }[] = [];

    // Sequential on purpose: each user costs a few Cognito admin calls and this
    // is a rare maintenance action, not a hot path.
    for (const u of external) {
      try {
        await setUserRole(u.username, 'employee');
        restricted.push(u.email);
      } catch (error) {
        failed.push({ email: u.email, error: error instanceof Error ? error.message : 'Failed' });
      }
    }

    return ok({
      scanned: users.length,
      external: external.length,
      restricted: restricted.length,
      failed,
    });
  } catch (error) {
    return fail(error);
  }
}
