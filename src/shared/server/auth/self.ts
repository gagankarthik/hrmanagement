import 'server-only';
import { employeeService } from '@/features/employees/server/employee.service';
import type { Employee } from '@/types/employee';
import type { Session } from './session';

/**
 * Server-side answer to "which employee record is this caller?" — the trusted
 * twin of the client's useSelfEmployee hook. Self-service endpoints use it to
 * scope reads and writes to the caller's own row instead of believing an
 * `employeeId` sent in the request.
 *
 * The company website and this portal share one Cognito pool, so a sign-in is
 * not by itself an employee. Three ways a login is matched to a person, in
 * order of trust:
 *
 *  1. `cognitoSub` on the employee record — the immutable Cognito user id.
 *     Set once and the link survives email changes and name changes.
 *  2. `loginEmail` — the address HR recorded as this person's sign-in.
 *  3. The employee's office / personal email matching the verified token email.
 *     This is the bootstrap path: most people sign in with the address already
 *     on their record.
 *
 * When 2 or 3 matches an unlinked record, the sub is written back so every
 * later request resolves by (1). Nothing else has to be done by hand.
 */

/**
 * Resolving an email to an employee means listing the table, and a single page
 * load makes several scoped calls. Cache the answer briefly per identity so one
 * page view costs one lookup, while an HR change still takes effect promptly.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { employee: Employee | null; expires: number }>();

function cacheKey(session: Session): string {
  return session.userId || session.email;
}

/** Persist the login link so future lookups are exact. Best-effort. */
async function linkSub(employee: Employee, session: Session): Promise<void> {
  try {
    await employeeService.update(employee.id, {
      cognitoSub: session.userId,
      loginEmail: session.email || employee.loginEmail,
    } as Partial<Employee>);
  } catch (error) {
    // A failed link is not a failed request — the email path still resolves.
    console.error('[auth] could not link login to employee', employee.id, error);
  }
}

export async function getSelfEmployee(session: Session): Promise<Employee | null> {
  const key = cacheKey(session);
  if (!key) return null;

  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.employee;

  const employees = await employeeService.list();
  const email = session.email;

  const bySub = session.userId ? employees.find((e) => e.cognitoSub === session.userId) : undefined;
  const byLoginEmail =
    !bySub && email ? employees.find((e) => e.loginEmail?.toLowerCase().trim() === email) : undefined;
  const byProfileEmail =
    !bySub && !byLoginEmail && email
      ? employees.find((e) => {
          // `officeEmail` exists on every employee type except Contract.
          const office = 'officeEmail' in e ? e.officeEmail : undefined;
          return [office, e.personalEmail].some((x) => x?.toLowerCase().trim() === email);
        })
      : undefined;

  const employee = bySub ?? byLoginEmail ?? byProfileEmail ?? null;

  // First match by email on an unlinked record — record the sub so the link is
  // exact from here on.
  if (employee && !employee.cognitoSub && session.userId) {
    employee.cognitoSub = session.userId;
    if (email) employee.loginEmail = email;
    await linkSub(employee, session);
  }

  cache.set(key, { employee, expires: Date.now() + CACHE_TTL_MS });
  return employee;
}

/** Just the id, for filtering record sets. */
export async function getSelfEmployeeId(session: Session): Promise<string | null> {
  return (await getSelfEmployee(session))?.id ?? null;
}

/** Drop a cached lookup — call after HR changes a link by hand. */
export function clearSelfEmployeeCache(): void {
  cache.clear();
}

/**
 * True when a record belongs to the caller — either it is keyed to their
 * employee id, or it carries their login email (self-service requests filed by
 * people with no employee record).
 */
export function ownsRecord(
  record: { employeeId?: string; requesterEmail?: string } | null | undefined,
  session: Session,
  selfEmployeeId: string | null,
): boolean {
  if (!record) return false;
  if (selfEmployeeId && record.employeeId === selfEmployeeId) return true;
  const requester = record.requesterEmail?.toLowerCase().trim();
  return Boolean(session.email && requester && requester === session.email);
}
