// SERVER-ONLY. S3 client for full-table DynamoDB backups. This is a SEPARATE
// bucket from document uploads (lib/s3.ts) — backups live in their own bucket so
// they can carry a stricter, download-only access policy. Credentials resolve the
// same way as the DynamoDB / documents clients; only the bucket + region differ.
import { S3Client } from '@aws-sdk/client-s3';

const region =
  process.env.BACKUPS_S3_REGION ||
  process.env.S3_REGION ||
  process.env.DYNAMODB_REGION ||
  process.env.APP_AWS_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-2';

const accessKeyId =
  process.env.DYNAMODB_ACCESS_KEY_ID ||
  process.env.APP_AWS_ACCESS_KEY_ID ||
  process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.DYNAMODB_SECRET_ACCESS_KEY ||
  process.env.APP_AWS_SECRET_ACCESS_KEY ||
  process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

/**
 * Bucket that holds the table backups. Read from BACKUP_S3_BUCKET (the older
 * plural name is still accepted as a fallback). Defaults to the provisioned
 * backups bucket if unset.
 */
export const BACKUPS_BUCKET =
  process.env.BACKUP_S3_BUCKET || process.env.BACKUPS_S3_BUCKET || 'oceanblue-backups-tables';

/**
 * Fixed key prefix (folder) every backup object lives under, trailing slash
 * included. This bucket is SHARED with other backups, so this app only ever
 * writes to, lists, and downloads from THIS folder — its exports stay isolated
 * from anything else in the bucket and it can never touch those other objects.
 * Override with BACKUP_S3_PREFIX only if you move this app's folder.
 */
export const BACKUPS_PREFIX =
  (process.env.BACKUP_S3_PREFIX || 'hr-employee-table-backups/').replace(/^\/+/, '').replace(/\/*$/, '/');

export const backupsConfigured = Boolean(BACKUPS_BUCKET);

export const backupsS3Client = new S3Client({
  region,
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
});

/**
 * Build the S3 object key for a new backup: `<prefix>backup-YYYY-MM-DD-HHmmss.json`.
 * The timestamp is UTC and second-precise so two backups in the same minute never
 * collide.
 */
export function backupObjectKey(now: Date = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp =
    `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())}` +
    `-${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}`;
  return `${BACKUPS_PREFIX}backup-${stamp}.json`;
}
