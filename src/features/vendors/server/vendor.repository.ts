import 'server-only';
import { BaseRepository } from '@/shared/server/db/base-repository';
import { GSI1_NAME, KEY_PREFIX } from '@/shared/server/db/keys';
import type { Vendor } from '../domain/vendor.types';

/** Vendor data access (CLIENTS-style single-table layout, listed via GSI1='VENDORS'). */
export const vendorRepository = new BaseRepository<Vendor>({
  prefix: KEY_PREFIX.vendor,
  list: { mode: 'query', indexName: GSI1_NAME, partitionValue: 'VENDORS' },
  decorate: (v) => ({ GSI1PK: 'VENDORS', GSI1SK: `${KEY_PREFIX.vendor}#${v.createdAt}` }),
});
