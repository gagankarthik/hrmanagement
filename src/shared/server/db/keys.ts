import 'server-only';

/**
 * Single-table key construction.
 *
 * The DynamoDB design uses `PK`/`SK` for the primary item and a `GSI1`
 * (partition `GSI1PK`, sort `GSI1SK`) for type/collection listing. Every entity
 * uses the convention `<PREFIX>#<id>` for its primary key, which was previously
 * inlined as string literals in each route (`PK: \`SUBCON#${id}\``). Centralizing
 * it here removes that duplication and prevents prefix typos.
 */

/** Entity key prefixes used across the single table. */
export const KEY_PREFIX = {
  employee: 'EMP',
  client: 'CLIENT',
  vendor: 'VENDOR',
  endClient: 'ENDCLIENT',
  subcontractor: 'SUBCON',
} as const;

export type KeyPrefix = (typeof KEY_PREFIX)[keyof typeof KEY_PREFIX] | string;

/** Primary key for an entity item: `{ PK: PREFIX#id, SK: PREFIX#id }`. */
export function primaryKey(prefix: KeyPrefix, id: string) {
  const k = `${prefix}#${id}`;
  return { PK: k, SK: k };
}

/** Name of the shared listing index. */
export const GSI1_NAME = 'GSI1-EmployeeType';
