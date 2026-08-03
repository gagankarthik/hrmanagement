import { NextRequest } from 'next/server';
import { clientService } from '@/features/clients/server/client.service';
import { ok, created, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

// GET - Fetch all clients
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await clientService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await clientService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
