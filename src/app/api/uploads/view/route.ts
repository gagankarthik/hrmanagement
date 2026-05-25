import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, s3Configured } from '@/lib/s3';

// GET /api/uploads/view?key=... -> 302 redirect to a short-lived presigned URL
export async function GET(request: NextRequest) {
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
