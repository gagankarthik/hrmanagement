import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_BUCKET, s3Configured } from '@/lib/s3';

// POST { fileName, contentType, folder } -> { url (presigned PUT), key }
export async function POST(request: NextRequest) {
  if (!s3Configured) {
    return NextResponse.json(
      { success: false, error: 'File uploads are not configured. Set DOCUMENTS_S3_BUCKET in the environment.' },
      { status: 501 }
    );
  }
  try {
    const { fileName, contentType, folder } = await request.json();
    const safeName = String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const safeFolder = String(folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'uploads';
    const key = `${safeFolder}/${uuidv4()}-${safeName}`;

    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType || 'application/octet-stream' }),
      { expiresIn: 300 }
    );

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('Error creating presigned upload URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to create upload URL' }, { status: 500 });
  }
}
