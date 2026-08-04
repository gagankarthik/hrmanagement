import 'server-only';

/**
 * A benefit plan carries `enrolledEmployeeIds`, the list of everyone on it.
 * That list is HR data: who is on the family medical plan is exactly the kind
 * of thing an employee must not be able to read about their colleagues, and
 * "the UI does not render it" is not a control when the API returns it.
 *
 * For a self-service caller the roster is reduced to their own membership, so
 * the "you are enrolled" state still works and nobody else's is disclosed.
 */
export function redactEnrollment<T extends Record<string, unknown>>(
  plan: T,
  selfEmployeeId: string | null,
): T {
  const enrolled = plan.enrolledEmployeeIds;
  if (!Array.isArray(enrolled)) return plan;
  const isEnrolled = Boolean(selfEmployeeId && enrolled.includes(selfEmployeeId));
  return { ...plan, enrolledEmployeeIds: isEnrolled ? [selfEmployeeId] : [] };
}
