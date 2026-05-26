import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// PUT - update a Handbook form entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();
    const item = {
      ...body,
      id,
      PK: `HBFORM#${id}`,
      SK: `HBFORM#${id}`,
      GSI1PK: 'HANDBOOK_FORMS',
      GSI1SK: body.GSI1SK || `HBFORM#${body.createdAt || now}`,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating handbook form:', error);
    return NextResponse.json({ success: false, error: 'Failed to update form' }, { status: 500 });
  }
}

// DELETE - remove a Handbook form entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `HBFORM#${id}`, SK: `HBFORM#${id}` } }));
    return NextResponse.json({ success: true, message: 'Form deleted' });
  } catch (error) {
    console.error('Error deleting handbook form:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete form' }, { status: 500 });
  }
}
