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

// GET - Fetch single employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMP#${id}`,
        SK: `EMP#${id}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.Item,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    // First get existing employee
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMP#${id}`,
        SK: `EMP#${id}`,
      },
    });

    const existing = await docClient.send(getCommand);

    if (!existing.Item) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const updatedItem = {
      ...existing.Item,
      ...body,
      id,
      PK: `EMP#${id}`,
      SK: `EMP#${id}`,
      GSI1PK: `TYPE#${body.type || existing.Item.type}`,
      GSI1SK: `EMP#${id}`,
      updatedAt: now,
    };

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedItem,
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMP#${id}`,
        SK: `EMP#${id}`,
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
