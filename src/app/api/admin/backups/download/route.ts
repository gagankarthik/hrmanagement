import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  backupsS3Client,
  BACKUPS_BUCKET,
  BACKUPS_PREFIX,
  backupsConfigured,
} from '@/lib/backups';

// GET /api/admin/backups/download?key=... → 302 redirect to a short-lived
// presigned URL that forces a download. Read-only: there is intentionally no
// PUT/DELETE counterpart, and the key is pinned to the backups prefix so this
// can never surface any other object in the bucket.
export async function GET(request: NextRequest) {
  if (!backupsConfigured) {
    return NextResponse.json({ success: false, error: 'Backups are not configured.' }, { status: 501 });
  }

  const key = new URL(request.url).searchParams.get('key') || '';
  // Guard against path traversal / arbitrary-object access.
  if (!key || key.includes('..') || !key.startsWith(BACKUPS_PREFIX)) {
    return NextResponse.json({ success: false, error: 'Invalid backup key' }, { status: 400 });
  }

  const fileName = key.slice(BACKUPS_PREFIX.length).replace(/[\r\n"]/g, '') || 'backup.json';

  try {
    const url = await getSignedUrl(
      backupsS3Client,
      new GetObjectCommand({
        Bucket: BACKUPS_BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${fileName}"`,
      }),
      { expiresIn: 120 },
    );
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error creating backup download URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to create download link' }, { status: 500 });
  }
}
