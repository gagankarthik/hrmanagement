import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { ok, badRequest, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';
import { clearSelfEmployeeCache } from '@/shared/server/auth/self';
import type { Employee } from '@/types/employee';

/**
 * Link a login to an employee record.
 *
 * Accounts and employee records are created separately: HR onboards a person
 * into the database, and invites a sign-in for them, and either can exist
 * without the other. The portal has to be told which sign-in belongs to which
 * person before it can show them their own leave, attendance and documents.
 *
 * The invite flow calls this straight after creating the account, and most of
 * the rest form themselves the first time someone signs in with the email
 * already on their record. This endpoint is also how HR fixes what is left:
 * someone who signs in with a personal address, a record created after the
 * account, or a link pointed at the wrong person.
 *
 * POST { sub, email?, employeeId }   → link (moves the link off any other record)
 * POST { sub, employeeId: null }     → unlink
 */
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const sub = String(body.sub || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const employeeId = body.employeeId ? String(body.employeeId) : null;

    if (!sub) return badRequest('A Cognito user id (sub) is required.');

    // One login maps to at most one person: clear it wherever it sits today.
    const employees = await employeeService.list();
    const previous = employees.filter((e) => e.cognitoSub === sub && e.id !== employeeId);
    for (const e of previous) {
      await employeeService.update(e.id, { cognitoSub: '', loginEmail: '' } as Partial<Employee>);
    }

    if (!employeeId) {
      clearSelfEmployeeCache();
      return ok({ employeeId: null, unlinked: previous.map((e) => e.id) });
    }

    const updated = await employeeService.update(employeeId, {
      cognitoSub: sub,
      loginEmail: email,
    } as Partial<Employee>);

    clearSelfEmployeeCache();
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
