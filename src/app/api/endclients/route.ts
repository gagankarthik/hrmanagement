import { NextRequest } from 'next/server';
import { endClientService } from '@/features/endclients/server/endclient.service';
import { ok, created, fail } from '@/shared/server/http/responses';

export async function GET() {
  try {
    const data = await endClientService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await endClientService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
