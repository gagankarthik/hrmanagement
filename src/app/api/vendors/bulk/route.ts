import { NextRequest, NextResponse } from 'next/server';
import { vendorService } from '@/features/vendors/server/vendor.service';
import { badRequest, fail } from '@/shared/server/http/responses';

// POST - Bulk-create vendors from validated import rows: { rows: [...] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return badRequest('No rows provided');

    const { created, failed, results } = await vendorService.bulkImport(rows);
    return NextResponse.json({ success: true, created, failed, results });
  } catch (error) {
    return fail(error);
  }
}
