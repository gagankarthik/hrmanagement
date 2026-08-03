import { NextRequest } from 'next/server';
import { vendorService } from '@/features/vendors/server/vendor.service';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await vendorService.get(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await vendorService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await vendorService.remove(id);
    return ok({ message: 'Vendor deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
