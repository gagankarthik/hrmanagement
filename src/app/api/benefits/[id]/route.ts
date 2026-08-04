import { NextRequest, NextResponse } from 'next/server';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';
import { redactEnrollment } from '../enrollment-privacy';

// GET - Fetch single benefit plan by ID. Same enrollment redaction as the list
// endpoint: a self-service caller sees the plan, not who else is on it.
export async function GET(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BENEFIT#${id}`,
        SK: `BENEFIT#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Benefit not found' },
        { status: 404 }
      );
    }

    let item = response.Item;
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      item = redactEnrollment(item, selfEmployeeId);
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching benefit:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch benefit' },
      { status: 500 }
    );
  }
}

// PUT - Update benefit plan
export async function PUT(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const item = {
      ...body,
      id,
      PK: `BENEFIT#${id}`,
      SK: `BENEFIT#${id}`,
      GSI1PK: 'BENEFITS',
      GSI1SK: body.GSI1SK || `BENEFIT#${body.createdAt || now}`,
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
    console.error('Error updating benefit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update benefit' },
      { status: 500 }
    );
  }
}

// DELETE - Delete benefit plan
export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `BENEFIT#${id}`,
        SK: `BENEFIT#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Benefit deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete benefit' },
      { status: 500 }
    );
  }
}
