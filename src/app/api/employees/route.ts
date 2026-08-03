import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { ok, created, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';
import { getSelfEmployee } from '@/shared/server/auth/self';

// GET - Fetch employees (optionally ?type=W2|Contract|1099|Offshore).
// Self-service users get exactly one row back: their own profile, which the
// portal needs to resolve their leave, attendance and documents.
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    if (!auth.session.fullAccess) {
      const self = await getSelfEmployee(auth.session);
      const data = self ? [self] : [];
      return ok(data, { count: data.length });
    }
    const type = new URL(request.url).searchParams.get('type');
    const data = await employeeService.list(type);
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await employeeService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
