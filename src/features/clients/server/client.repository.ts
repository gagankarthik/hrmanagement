import 'server-only';
import { BaseRepository } from '@/shared/server/db/base-repository';
import { GSI1_NAME, KEY_PREFIX } from '@/shared/server/db/keys';
import type { Client } from '../domain/client.types';

/**
 * Client data access. All DynamoDB specifics (keys, the CLIENTS listing index,
 * GSI decoration) declared once; CRUD comes from BaseRepository. Replaces the
 * hand-written command code in the old `/api/clients` route handlers.
 */
export const clientRepository = new BaseRepository<Client>({
  prefix: KEY_PREFIX.client,
  list: { mode: 'query', indexName: GSI1_NAME, partitionValue: 'CLIENTS' },
  decorate: (c) => ({ GSI1PK: 'CLIENTS', GSI1SK: `${KEY_PREFIX.client}#${c.createdAt}` }),
});
