import { NextRequest, NextResponse } from 'next/server';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch single subcontractor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SUBCON#${id}`,
        SK: `SUBCON#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.Item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching subcontractor:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch subcontractor' },
      { status: 500 }
    );
  }
}

// PUT - Update subcontractor
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
      PK: `SUBCON#${id}`,
      SK: `SUBCON#${id}`,
      GSI1PK: 'SUBCONTRACTORS',
      GSI1SK: body.GSI1SK || `SUBCON#${body.createdAt || now}`,
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
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subcontractor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SUBCON#${id}`,
        SK: `SUBCON#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Subcontractor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subcontractor' },
      { status: 500 }
    );
  }
}
