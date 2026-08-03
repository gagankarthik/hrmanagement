import { NextResponse, NextRequest } from 'next/server';
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import {
  backupsS3Client,
  BACKUPS_BUCKET,
  BACKUPS_PREFIX,
  backupsConfigured,
  backupObjectKey,
} from '@/lib/backups';
import { ok, created, serverError } from '@/shared/server/http/responses';
import { authorize } from '@/shared/server/auth/guards';

// Backups run against the whole single table, so exports can be large-ish;
// never let Next cache this route.
export const dynamic = 'force-dynamic';

export interface BackupObject {
  key: string;
  /** File name only (prefix stripped), e.g. backup-2026-07-21-143005.json */
  name: string;
  size: number;
  lastModified: string | null;
}

function notConfigured(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error:
        'Backups are not configured. Set BACKUPS_S3_BUCKET (and AWS credentials) in the environment.',
    },
    { status: 501 },
  );
}

/** GET /api/admin/backups → list every backup file in the bucket (newest first). */
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'admin');
  if (!auth.ok) return auth.response;

  if (!backupsConfigured) return notConfigured();
  try {
    const items: BackupObject[] = [];
    let ContinuationToken: string | undefined;

    do {
      const res = await backupsS3Client.send(
        new ListObjectsV2Command({
          Bucket: BACKUPS_BUCKET,
          Prefix: BACKUPS_PREFIX,
          ContinuationToken,
        }),
      );
      for (const o of res.Contents ?? []) {
        const key = o.Key ?? '';
        // Skip the "folder" placeholder object if one exists.
        if (!key || key === BACKUPS_PREFIX) continue;
        items.push({
          key,
          name: key.slice(BACKUPS_PREFIX.length),
          size: o.Size ?? 0,
          lastModified: o.LastModified ? o.LastModified.toISOString() : null,
        });
      }
      ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (ContinuationToken);

    items.sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''));
    return ok(items, { count: items.length });
  } catch (error) {
    return serverError(error, 'Failed to list backups');
  }
}

/**
 * POST /api/admin/backups → scan the entire DynamoDB table and write a single
 * JSON snapshot to S3 as backup-[date]-[time].json. Read-only against Dynamo;
 * creates one new immutable object in the backups bucket.
 */
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'admin');
  if (!auth.ok) return auth.response;

  if (!backupsConfigured) return notConfigured();
  try {
    // Full-table scan, following pagination until every item is collected.
    const records: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const res = await docClient.send(
        new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey }),
      );
      records.push(...((res.Items ?? []) as Record<string, unknown>[]));
      ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);

    const exportedAt = new Date();
    const key = backupObjectKey(exportedAt);
    const name = key.slice(BACKUPS_PREFIX.length);

    const payload = JSON.stringify(
      {
        table: TABLE_NAME,
        exportedAt: exportedAt.toISOString(),
        count: records.length,
        format: 'dynamodb-document-json',
        items: records,
      },
      null,
      2,
    );

    await backupsS3Client.send(
      new PutObjectCommand({
        Bucket: BACKUPS_BUCKET,
        Key: key,
        Body: payload,
        ContentType: 'application/json',
      }),
    );

    return created(
      { key, name, size: Buffer.byteLength(payload), count: records.length, exportedAt: exportedAt.toISOString() },
    );
  } catch (error) {
    return serverError(error, 'Failed to export data to S3');
  }
}
