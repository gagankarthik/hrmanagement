import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { s3Client, S3_BUCKET, s3Configured } from '@/lib/s3';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId, ownsRecord } from '@/shared/server/auth/self';
import type { Session } from '@/shared/server/auth/session';
import type { UploadedDoc } from '@/types/uploads';

/**
 * Company-wide reference material every signed-in user is meant to read: the
 * handbook, procedures, policies and benefit plan documents. Nothing here is
 * personal to anyone, so no per-caller check applies.
 *
 * Personnel files, immigration evidence and leave attachments are deliberately
 * absent — those are personal data and are checked against the caller below.
 */
const COMPANY_WIDE_FOLDERS = ['sops', 'handbook-forms', 'policies', 'benefits', 'procedures'];

/**
 * True when a leave attachment belongs to the caller.
 *
 * Attachment keys are flat (`leaves/<uuid>-<name>`), so the folder says nothing
 * about who owns the file and an unguessable key is not an access control. The
 * only trustworthy answer is whether the key appears on a leave record the
 * caller owns, so that is what we check.
 */
async function ownsLeaveAttachment(key: string, session: Session): Promise<boolean> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :leavesKey',
      ExpressionAttributeValues: { ':leavesKey': 'LEAVES' },
    }),
  );

  const selfEmployeeId = await getSelfEmployeeId(session);
  return (res.Items || []).some((item) => {
    if (!ownsRecord(item, session, selfEmployeeId)) return false;
    const docs = (item.documents || []) as UploadedDoc[];
    return docs.some((d) => d?.key === key);
  });
}

/** True when this caller is allowed to read the given S3 key. */
async function canRead(key: string, session: Session): Promise<boolean> {
  if (session.fullAccess) return true;
  const [root, second] = key.split('/');
  if (COMPANY_WIDE_FOLDERS.includes(root)) return true;
  // Their own personnel folder only: employee-docs/<their employee id>/...
  if (root === 'employee-docs' && second) {
    const selfEmployeeId = await getSelfEmployeeId(session);
    return Boolean(selfEmployeeId && selfEmployeeId === second);
  }
  // Their own leave attachments only.
  if (root === 'leaves') return ownsLeaveAttachment(key, session);
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
