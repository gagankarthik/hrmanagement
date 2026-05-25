// SERVER-ONLY. S3 client for document uploads. Credentials come from non-public
// env vars (same resolution as the DynamoDB client); the legacy NEXT_PUBLIC_*
// names are accepted only as a migration fallback. Set DOCUMENTS_S3_BUCKET to
// enable uploads.
import { S3Client } from '@aws-sdk/client-s3';

const region =
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

export const S3_BUCKET = process.env.DOCUMENTS_S3_BUCKET || process.env.S3_BUCKET || '';
export const s3Configured = Boolean(S3_BUCKET);

export const s3Client = new S3Client({
  region,
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
});
