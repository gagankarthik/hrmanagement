import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, s3Configured } from '@/lib/s3';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';
import type { Session } from '@/shared/server/auth/session';

/**
 * Company-wide reference material a self-service user is meant to read: the
 * handbook, procedures, policies, benefit plan documents, and leave
 * attachments (whose keys they only ever learn from their own requests).
 * Personnel files and immigration evidence are deliberately absent.
 */
const SELF_SERVICE_READ_FOLDERS = ['sops', 'handbook-forms', 'policies', 'benefits', 'leaves', 'procedures'];

/** True when this caller is allowed to read the given S3 key. */
async function canRead(key: string, session: Session): Promise<boolean> {
  if (session.fullAccess) return true;
  const [root, second] = key.split('/');
  if (SELF_SERVICE_READ_FOLDERS.includes(root)) return true;
  // Their own personnel folder only: employee-docs/<their employee id>/...
  if (root === 'employee-docs' && second) {
    const selfEmployeeId = await getSelfEmployeeId(session);
    return Boolean(selfEmployeeId && selfEmployeeId === second);
  }
  return false;
}

// GET /api/uploads/view?key=... -> 302 redirect to a short-lived presigned URL
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  if (!s3Configured) {
    return NextResponse.json({ success: false, error: 'File uploads are not configured.' }, { status: 501 });
  }
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const download = searchParams.get('download') === '1';
  const name = (searchParams.get('name') || 'download').replace(/[\r\n"]/g, '');
  if (!key) {
    return NextResponse.json({ success: false, error: 'key is required' }, { status: 400 });
  }
  if (!(await canRead(key, auth.session))) {
    return forbidden('You do not have access to this file.');
  }
  try {
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        // Force a download when requested; otherwise let the browser render inline.
        ResponseContentDisposition: download ? `attachment; filename="${name}"` : 'inline',
      }),
      { expiresIn: 300 }
    );
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error creating presigned view URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to create view URL' }, { status: 500 });
  }
}
