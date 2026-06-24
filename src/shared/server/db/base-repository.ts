import 'server-only';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from './client';
import { primaryKey } from './keys';
import { NotFoundError } from '../errors';

/** Entity shape the base repository manages: an id plus audit timestamps. */
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuration that adapts the generic repository to a specific entity's
 * single-table layout. The previously per-route DynamoDB command code collapses
 * into this small object.
 */
export interface RepositoryConfig<T extends Entity> {
  /** Key prefix, e.g. 'SUBCON' → PK/SK `SUBCON#<id>`. */
  prefix: string;
  /** How `list()` reads the collection. */
  list:
    | { mode: 'query'; indexName: string; partitionValue: string; partitionAttr?: string }
    | { mode: 'scan' };
  /**
   * Extra attributes (typically GSI keys) written on every create/update,
   * derived from the persisted item. Runs after id/timestamps are set.
   */
  decorate?: (item: T) => Record<string, unknown>;
}

/**
 * Generic single-table repository: get / list / create / update / delete.
 *
 * Behavior matches the hand-written routes it replaces — `create` assigns a
 * uuid + timestamps, `update` is a read-merge-write that preserves existing
 * fields, and both re-apply the entity's GSI decoration.
 */
export class BaseRepository<T extends Entity> {
  constructor(private readonly cfg: RepositoryConfig<T>) {}

  async list(): Promise<T[]> {
    if (this.cfg.list.mode === 'scan') {
      const res = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
      return (res.Items || []) as T[];
    }
    const { indexName, partitionValue, partitionAttr = 'GSI1PK' } = this.cfg.list;
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': partitionAttr },
        ExpressionAttributeValues: { ':pk': partitionValue },
      }),
    );
    return (res.Items || []) as T[];
  }

  async get(id: string): Promise<T | null> {
    const res = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: primaryKey(this.cfg.prefix, id) }),
    );
    return (res.Item as T) || null;
  }

  /** Like `get`, but throws NotFoundError instead of returning null. */
  async getOrThrow(id: string): Promise<T> {
    const item = await this.get(id);
    if (!item) throw new NotFoundError(`${this.cfg.prefix} ${id} not found`);
    return item;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const record = { ...data, id, createdAt: now, updatedAt: now } as T;
    await this.put(record);
    return record;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const existing = await this.getOrThrow(id);
    const now = new Date().toISOString();
    const record = { ...existing, ...patch, id, createdAt: existing.createdAt, updatedAt: now } as T;
    await this.put(record);
    return record;
  }

  async remove(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: primaryKey(this.cfg.prefix, id) }),
    );
  }

  /** Persist a complete record with its primary key + GSI decoration applied. */
  private async put(record: T): Promise<void> {
    const item = {
      ...record,
      ...primaryKey(this.cfg.prefix, record.id),
      ...(this.cfg.decorate ? this.cfg.decorate(record) : {}),
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  }
}
