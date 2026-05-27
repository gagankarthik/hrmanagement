import { NextRequest, NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { buildI983Pdf } from '@/lib/i983-pdf';
import { I983Record } from '@/types/i983';

export const runtime = 'nodejs';

// GET - download a filled Form I-983 PDF for an employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;
    const res = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `I983#${employeeId}`, SK: `I983#${employeeId}` } }));
    if (!res.Item) {
      return NextResponse.json({ success: false, error: 'No I-983 record for this employee yet' }, { status: 404 });
    }
    const record = res.Item as I983Record;
    const { bytes, official } = await buildI983Pdf(record);
    const safeName = (record.employeeName || 'employee').replace(/[^a-z0-9]+/gi, '-');
    const suffix = official ? 'I-983' : 'I-983-worksheet';
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${suffix}-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating I-983 PDF:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate I-983 PDF' }, { status: 500 });
  }
}
