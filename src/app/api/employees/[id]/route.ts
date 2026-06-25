import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { ok, fail } from '@/shared/server/http/responses';

// GET - Fetch single employee by ID
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await employeeService.get(id));
  } catch (error) {
    return fail(error);
  }
}

// PUT - Update employee
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await employeeService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

// DELETE - Delete employee
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await employeeService.remove(id);
    return ok({ message: 'Employee deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
