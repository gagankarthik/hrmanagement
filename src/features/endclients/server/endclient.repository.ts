import 'server-only';
import { BaseRepository } from '@/shared/server/db/base-repository';
import { GSI1_NAME, KEY_PREFIX } from '@/shared/server/db/keys';
import type { EndClient } from '../domain/endclient.types';

/**
 * End Client data access. NOTE: the listing partition is `END_CLIENTS`
 * (underscore) — matching the existing data — while the key prefix is `ENDCLIENT`.
 */
export const endClientRepository = new BaseRepository<EndClient>({
  prefix: KEY_PREFIX.endClient,
  list: { mode: 'query', indexName: GSI1_NAME, partitionValue: 'END_CLIENTS' },
  decorate: (c) => ({ GSI1PK: 'END_CLIENTS', GSI1SK: `${KEY_PREFIX.endClient}#${c.createdAt}` }),
});
