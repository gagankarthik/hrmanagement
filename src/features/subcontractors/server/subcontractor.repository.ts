import 'server-only';
import { BaseRepository } from '@/shared/server/db/base-repository';
import { GSI1_NAME, KEY_PREFIX } from '@/shared/server/db/keys';
import type { Subcontractor } from '../domain/subcontractor.types';

/**
 * Subcontractor data access. All DynamoDB specifics (keys, the SUBCONTRACTORS
 * listing index, GSI decoration) are declared here once; CRUD comes from
 * BaseRepository. Replaces the per-route command code in the old
 * `/api/subcontractors` handlers.
 */
export const subcontractorRepository = new BaseRepository<Subcontractor>({
  prefix: KEY_PREFIX.subcontractor,
  list: { mode: 'query', indexName: GSI1_NAME, partitionValue: 'SUBCONTRACTORS' },
  decorate: (s) => ({
    GSI1PK: 'SUBCONTRACTORS',
    GSI1SK: `${KEY_PREFIX.subcontractor}#${s.createdAt}`,
  }),
});
