import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// PUT - update a SOP entry
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
      PK: `SOP#${id}`,
      SK: `SOP#${id}`,
      GSI1PK: 'SOPS',
      GSI1SK: body.GSI1SK || `SOP#${body.createdAt || now}`,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating SOP:', error);
    return NextResponse.json({ success: false, error: 'Failed to update SOP' }, { status: 500 });
  }
}

// DELETE - remove a SOP entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `SOP#${id}`, SK: `SOP#${id}` } }));
    return NextResponse.json({ success: true, message: 'SOP deleted' });
  } catch (error) {
    console.error('Error deleting SOP:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete SOP' }, { status: 500 });
  }
}
