import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `INV#${id}`, SK: `INV#${id}` } }));
    if (!response.Item) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: response.Item });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `INV#${id}`, SK: `INV#${id}` } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const item = {
      ...existing.Item,
      ...body,
      id,
      PK: `INV#${id}`,
      SK: `INV#${id}`,
      GSI1PK: 'INVOICES',
      GSI1SK: `INV#${body.issueDate || existing.Item.issueDate}#${id}`,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `INV#${id}`, SK: `INV#${id}` } }));
    return NextResponse.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 });
  }
}
