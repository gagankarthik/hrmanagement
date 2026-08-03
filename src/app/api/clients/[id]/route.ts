import { NextRequest } from 'next/server';
import { clientService } from '@/features/clients/server/client.service';
import { ok, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

// GET - Fetch single client by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await clientService.get(id));
  } catch (error) {
    return fail(error);
  }
}

// PUT - Update client
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    return ok(await clientService.update(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

// DELETE - Delete client
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await clientService.remove(id);
    return ok({ message: 'Client deleted successfully' });
  } catch (error) {
    return fail(error);
  }
}
