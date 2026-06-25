import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '@/features/employees/server/employee.service';
import { badRequest, fail } from '@/shared/server/http/responses';

// POST - Bulk-create employees from validated import rows: { rows: [...] }
// Each row must carry a `type` (W2 | Contract | 1099 | Offshore).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return badRequest('No rows provided');

    const { created, failed, results } = await employeeService.bulkImport(rows);
    return NextResponse.json({ success: true, created, failed, results });
  } catch (error) {
    return fail(error);
  }
}
