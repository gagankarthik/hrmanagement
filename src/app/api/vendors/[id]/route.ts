import { NextRequest } from 'next/server';
import { vendorService } from '@/features/vendors/server/vendor.service';
import { ok, fail } from '@/shared/server/http/responses';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await vendorService.get(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await vendorService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await vendorService.remove(id);
    return ok({ message: 'Vendor deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
