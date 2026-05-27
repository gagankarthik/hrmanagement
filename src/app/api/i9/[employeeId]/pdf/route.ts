import { NextRequest, NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { buildI9Pdf, type I9EmployeeLike } from '@/lib/i9-pdf';
import { I9Record } from '@/types/i9';

export const runtime = 'nodejs';

// GET - download a pre-filled official USCIS Form I-9 for an employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;
    const recRes = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `I9#${employeeId}`, SK: `I9#${employeeId}` } }));
    if (!recRes.Item) {
      return NextResponse.json({ success: false, error: 'No I-9 record for this employee yet' }, { status: 404 });
    }
    const record = recRes.Item as I9Record;
    const empRes = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `EMP#${employeeId}`, SK: `EMP#${employeeId}` } }));
    const emp = (empRes.Item || {}) as I9EmployeeLike;

    const bytes = await buildI9Pdf(record, emp);
    const safeName = (record.employeeName || emp.name || 'employee').replace(/[^a-z0-9]+/gi, '-');
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Form-I-9-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating I-9 PDF:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate I-9 PDF' }, { status: 500 });
  }
}
