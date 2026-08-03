import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';

// GET - Fetch single employee by ID (self-service users: only their own record)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      if (!selfEmployeeId || selfEmployeeId !== id) return forbidden();
    }
    return ok(await employeeService.get(id));
  } catch (error) {
    return fail(error);
  }
}

// PUT - Update employee
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await employeeService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

// DELETE - Delete employee
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await employeeService.remove(id);
    return ok({ message: 'Employee deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
