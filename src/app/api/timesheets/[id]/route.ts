import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `TS#${id}`, SK: `TS#${id}` } }));
    if (!response.Item) {
      return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: response.Item });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch timesheet' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `TS#${id}`, SK: `TS#${id}` } }));
    if (!existing.Item) {
      return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });
    }

    const item = {
      ...existing.Item,
      ...body,
      id,
      hours: Number(body.hours ?? existing.Item.hours) || 0,
      billRate: Number(body.billRate ?? existing.Item.billRate) || 0,
      payRate: Number(body.payRate ?? existing.Item.payRate) || 0,
      PK: `TS#${id}`,
      SK: `TS#${id}`,
      GSI1PK: 'TIMESHEETS',
      GSI1SK: `TS#${body.periodStart || existing.Item.periodStart}#${id}`,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json({ success: false, error: 'Failed to update timesheet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `TS#${id}`, SK: `TS#${id}` } }));
    return NextResponse.json({ success: true, message: 'Timesheet deleted' });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete timesheet' }, { status: 500 });
  }
}
