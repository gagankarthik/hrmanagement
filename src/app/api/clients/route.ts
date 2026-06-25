import { NextRequest } from 'next/server';
import { clientService } from '@/features/clients/server/client.service';
import { ok, created, fail } from '@/shared/server/http/responses';

// GET - Fetch all clients
export async function GET() {
  try {
    const data = await clientService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  try {
    const data = await clientService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
