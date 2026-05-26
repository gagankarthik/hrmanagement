import { NextRequest, NextResponse } from 'next/server';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch single end client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ENDCLIENT#${id}`,
        SK: `ENDCLIENT#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'End client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.Item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching end client:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch end client' },
      { status: 500 }
    );
  }
}

// PUT - Update end client
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
      PK: `ENDCLIENT#${id}`,
      SK: `ENDCLIENT#${id}`,
      GSI1PK: 'END_CLIENTS',
      GSI1SK: body.GSI1SK || `ENDCLIENT#${body.createdAt || now}`,
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
    console.error('Error updating end client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update end client' },
      { status: 500 }
    );
  }
}

// DELETE - Delete end client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `ENDCLIENT#${id}`,
        SK: `ENDCLIENT#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'End client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting end client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete end client' },
      { status: 500 }
    );
  }
}
