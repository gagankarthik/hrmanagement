// SERVER-ONLY. Builds DynamoDB items from validated bulk rows and writes them
// with BatchWrite (25 per request, with one retry for UnprocessedItems).
// Imports dynamodb.ts, so never pull this into a Client Component.

import { BatchWriteCommand, type BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { BulkRowResult } from './types';

export type PartnerKind = 'CLIENT' | 'VENDOR' | 'SUBCON' | 'ENDCLIENT';

const PARTNER_GSI: Record<PartnerKind, string> = {
  CLIENT: 'CLIENTS',
  VENDOR: 'VENDORS',
  SUBCON: 'SUBCONTRACTORS',
  ENDCLIENT: 'END_CLIENTS',
};

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Write items in batches of 25, retrying unprocessed items once. Throws on failure. */
async function batchPut(items: Row[]): Promise<void> {
  for (const group of chunk(items, 25)) {
    let requestItems: BatchWriteCommandInput['RequestItems'] = {
      [TABLE_NAME]: group.map((Item) => ({ PutRequest: { Item } })),
    } as BatchWriteCommandInput['RequestItems'];

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
      const unprocessed = res.UnprocessedItems?.[TABLE_NAME];
      if (!unprocessed || unprocessed.length === 0) break;
      requestItems = { [TABLE_NAME]: unprocessed };
      if (attempt === 2) throw new Error(`${unprocessed.length} item(s) could not be written`);
    }
  }
}

function buildPartnerItem(kind: PartnerKind, row: Row): Row {
  const id = uuidv4();
  const now = new Date().toISOString();
  return {
    id,
    name: str(row.name),
    contactPerson: str(row.contactPerson),
    email: str(row.email),
    phone: str(row.phone),
    address: str(row.address),
    status: str(row.status) || 'Active',
    PK: `${kind}#${id}`,
    SK: `${kind}#${id}`,
    GSI1PK: PARTNER_GSI[kind],
    GSI1SK: `${kind}#${now}#${id}`,
    createdAt: now,
    updatedAt: now,
  };
}

function buildEmployeeItem(row: Row): Row {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item: Row = {
    ...row,
    id,
    PK: `EMP#${id}`,
    SK: `EMP#${id}`,
    GSI1PK: `TYPE#${str(row.type)}`,
    GSI1SK: `EMP#${id}`,
    createdAt: now,
    updatedAt: now,
  };
  // Mirror the single-create flow: keep a one-item assignment list alongside the
  // primary id so the workforce views render the placement consistently.
  if (row.clientId) item.clientAssignments = [{ clientId: row.clientId }];
  if (row.vendorId) item.vendorAssignments = [{ vendorId: row.vendorId }];
  return item;
}

export interface BulkOutcome {
  created: number;
  failed: number;
  results: BulkRowResult[];
}

/** Shared driver: validates a required field per row, builds items, writes them. */
async function run(
  rows: Row[],
  requiredField: string,
  requiredLabel: string,
  build: (row: Row) => Row,
): Promise<BulkOutcome> {
  const results: BulkRowResult[] = [];
  const items: Row[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 1;
    if (str(row[requiredField]).trim() === '') {
      results.push({ rowNumber, ok: false, error: `${requiredLabel} is required` });
      return;
    }
    items.push(build(row));
    results.push({ rowNumber, ok: true });
  });

  try {
    if (items.length) await batchPut(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Write failed';
    // The whole batch failed — mark the previously-ok rows as failed.
    for (const r of results) {
      if (r.ok) { r.ok = false; r.error = message; }
    }
  }

  const created = results.filter((r) => r.ok).length;
  return { created, failed: results.length - created, results };
}

export function bulkCreatePartners(kind: PartnerKind, rows: Row[]): Promise<BulkOutcome> {
  return run(rows, 'name', 'Name', (row) => buildPartnerItem(kind, row));
}

export function bulkCreateEmployees(rows: Row[]): Promise<BulkOutcome> {
  return run(rows, 'type', 'Type', buildEmployeeItem);
}
