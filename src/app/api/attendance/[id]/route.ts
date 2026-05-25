import { NextRequest, NextResponse } from 'next/server';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch single attendance record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ATT#${id}`,
        SK: `ATT#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.Item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching attendance:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// PUT - Update attendance record
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
      PK: `ATT#${id}`,
      SK: `ATT#${id}`,
      GSI1PK: 'ATTENDANCE',
      GSI1SK: body.GSI1SK || `ATT#${body.createdAt || now}`,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ATT#${id}`,
        SK: `ATT#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
