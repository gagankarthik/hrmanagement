import { NextRequest } from 'next/server';
import { subcontractorService } from '@/features/subcontractors/server/subcontractor.service';
import { ok, created, fail } from '@/shared/server/http/responses';

// GET - Fetch all subcontractors
export async function GET() {
  try {
    const data = await subcontractorService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new subcontractor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await subcontractorService.create(body);
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
