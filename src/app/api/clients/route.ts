import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

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

// GET - Fetch all clients
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching clients from table:', TABLE_NAME);

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :clientsKey',
      ExpressionAttributeValues: {
        ':clientsKey': 'CLIENTS',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Clients count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching clients:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      id,
      name: body.name,
      contactPerson: body.contactPerson || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      status: body.status || 'Active',
      PK: `CLIENT#${id}`,
      SK: `CLIENT#${id}`,
      GSI1PK: 'CLIENTS',
      GSI1SK: `CLIENT#${now}`,
      createdAt: now,
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
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
