import { NextRequest } from 'next/server';
import { endClientService } from '@/features/endclients/server/endclient.service';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await endClientService.get(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await endClientService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await endClientService.remove(id);
    return ok({ message: 'End client deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
