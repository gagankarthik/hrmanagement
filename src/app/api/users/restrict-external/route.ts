import { NextRequest } from 'next/server';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';
import { listUsers, setUserRole } from '@/lib/cognito';

/**
 * Confine external workforce accounts to this portal.
 *
 * `employee` accounts are the people placed with clients. They belong here and
 * nowhere else, but anyone created before role groups were namespaced may still
 * sit in a bare `employee` group — the same shape the company website reads, so
 * it could be honoured over there.
 *
 * Re-applying the role rewrites them to `hr:employee` and clears every legacy
 * bare group, which leaves nothing the website would recognise. Internal staff
 * (admin / hr / recruiter / sales) are untouched: they are meant to hold
 * accounts on both sides, and their website groups are the website's business.
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
