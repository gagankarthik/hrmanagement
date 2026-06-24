import { NextRequest } from 'next/server';
import { subcontractorService } from '@/features/subcontractors/server/subcontractor.service';
import { ok, fail } from '@/shared/server/http/responses';

// GET - Fetch single subcontractor by ID
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await subcontractorService.get(id));
  } catch (error) {
    return fail(error);
  }
}

// PUT - Update subcontractor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return ok(await subcontractorService.update(id, body));
  } catch (error) {
    return fail(error);
  }
}

// DELETE - Delete subcontractor
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await subcontractorService.remove(id);
    return ok({ message: 'Subcontractor deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
