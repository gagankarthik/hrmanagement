import { NextRequest } from 'next/server';
import { subcontractorService } from '@/features/subcontractors/server/subcontractor.service';
import { ok, created, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

// GET - Fetch all subcontractors
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await subcontractorService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new subcontractor
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const data = await subcontractorService.create(body);
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
