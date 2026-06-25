import { NextRequest, NextResponse } from 'next/server';
import { endClientService } from '@/features/endclients/server/endclient.service';
import { badRequest, fail } from '@/shared/server/http/responses';

// POST - Bulk-create end clients from validated import rows: { rows: [...] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return badRequest('No rows provided');

    const { created, failed, results } = await endClientService.bulkImport(rows);
    return NextResponse.json({ success: true, created, failed, results });
  } catch (error) {
    return fail(error);
  }
}
