import { NextRequest } from 'next/server';
import { endClientService } from '@/features/endclients/server/endclient.service';
import { ok, created, fail } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await endClientService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const data = await endClientService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
