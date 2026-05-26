import { NextRequest, NextResponse } from 'next/server';
import { bulkCreatePartners } from '@/lib/bulk-import/server';

// POST - Bulk-create clients from validated import rows: { rows: [...] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'No rows provided' }, { status: 400 });
    }
    const { created, failed, results } = await bulkCreatePartners('CLIENT', rows);
    return NextResponse.json({ success: true, created, failed, results });
  } catch (error) {
    const err = error as Error;
    console.error('Bulk client import failed:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Bulk import failed' },
      { status: 500 }
    );
  }
}
