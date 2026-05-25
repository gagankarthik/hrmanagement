import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all subcontractors
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :subconKey',
      ExpressionAttributeValues: {
        ':subconKey': 'SUBCONTRACTORS',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Subcontractors count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching subcontractors:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch subcontractors' },
      { status: 500 }
    );
  }
}

// POST - Create new subcontractor
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
      PK: `SUBCON#${id}`,
      SK: `SUBCON#${id}`,
      GSI1PK: 'SUBCONTRACTORS',
      GSI1SK: `SUBCON#${now}`,
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
    console.error('Error creating subcontractor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subcontractor' },
      { status: 500 }
    );
  }
}
