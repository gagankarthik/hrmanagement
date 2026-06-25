import { NextRequest } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { ok, created, fail } from '@/shared/server/http/responses';

// GET - Fetch all employees (optionally ?type=W2|Contract|1099|Offshore)
export async function GET(request: NextRequest) {
  try {
    const type = new URL(request.url).searchParams.get('type');
    const data = await employeeService.list(type);
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const data = await employeeService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
