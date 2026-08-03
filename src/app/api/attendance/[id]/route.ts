import { NextRequest, NextResponse } from 'next/server';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';

// GET - Fetch single attendance record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

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

    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      if (!selfEmployeeId || response.Item.employeeId !== selfEmployeeId) return forbidden();
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

// PUT - Update attendance record. HR can edit any row; a self-service user may
// only amend their own day (clocking out, a note), never whose day it is.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    if (!auth.session.fullAccess) {
      const existing = await docClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { PK: `ATT#${id}`, SK: `ATT#${id}` } })
      );
      if (!existing.Item) {
        return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
      }
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      if (!selfEmployeeId || existing.Item.employeeId !== selfEmployeeId) return forbidden();
      // Ownership and the day itself are not theirs to rewrite.
      body.employeeId = existing.Item.employeeId;
      body.date = existing.Item.date;
      body.createdAt = existing.Item.createdAt;
    }

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

// DELETE - Delete attendance record (HR only; people correct their day through HR)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

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
