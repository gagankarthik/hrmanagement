import { NextRequest } from 'next/server';
import { vendorService } from '@/features/vendors/server/vendor.service';
import { ok, created, fail } from '@/shared/server/http/responses';

export async function GET() {
  try {
    const data = await vendorService.list();
    return ok(data, { count: data.length });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await vendorService.create(await request.json());
    return created(data);
  } catch (error) {
    return fail(error);
  }
}
