import 'server-only';

/**
 * Shared DynamoDB document client + table name.
 *
 * During the incremental migration this re-exports the existing, battle-tested
 * client from `@/lib/dynamodb` so there is exactly one configured connection in
 * the process. Once every feature has moved onto repositories, the client
 * construction itself can be lifted here and `lib/dynamodb.ts` retired.
 */
export { docClient, TABLE_NAME, isDynamoDBConfigured } from '@/lib/dynamodb';
