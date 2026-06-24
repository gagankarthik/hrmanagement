import { NextRequest, NextResponse } from 'next/server';
import { subcontractorService } from '@/features/subcontractors/server/subcontractor.service';
import { badRequest, fail } from '@/shared/server/http/responses';

// POST - Bulk-create subcontractors from validated import rows: { rows: [...] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return badRequest('No rows provided');

    const { created, failed, results } = await subcontractorService.bulkImport(rows);
    return NextResponse.json({ success: true, created, failed, results });
  } catch (error) {
    return fail(error);
  }
}
