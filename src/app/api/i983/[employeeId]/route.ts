import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;
    const response = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `I983#${employeeId}`, SK: `I983#${employeeId}` } }));
    if (!response.Item) {
      return NextResponse.json({ success: false, error: 'I-983 record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: response.Item });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch I-983 record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `I983#${employeeId}`, SK: `I983#${employeeId}` } }));
    return NextResponse.json({ success: true, message: 'I-983 record deleted' });
  } catch (error) {
    console.error('Error deleting I-983 record:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete I-983 record' }, { status: 500 });
  }
}
