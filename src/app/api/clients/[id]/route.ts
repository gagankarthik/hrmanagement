import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.NEXT_PUBLIC_DYNAMODB_TABLE_NAME || 'HRManagement-Employees';

// GET - Fetch single client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLIENT#${id}`,
        SK: `CLIENT#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.Item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching client:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const now = new Date().toISOString();

    const item = {
      ...body,
      id,
      PK: `CLIENT#${id}`,
      SK: `CLIENT#${id}`,
      GSI1PK: 'CLIENTS',
      GSI1SK: body.GSI1SK || `CLIENT#${body.createdAt || now}`,
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
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLIENT#${id}`,
        SK: `CLIENT#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
