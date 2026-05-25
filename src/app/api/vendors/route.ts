import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all vendors
export async function GET(request: NextRequest) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :vendorsKey',
      ExpressionAttributeValues: {
        ':vendorsKey': 'VENDORS',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Vendors count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching vendors:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST - Create new vendor
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
      PK: `VENDOR#${id}`,
      SK: `VENDOR#${id}`,
      GSI1PK: 'VENDORS',
      GSI1SK: `VENDOR#${now}`,
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
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
