import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all employees or by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let command;

    if (type && type !== 'All') {
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1-EmployeeType',
        KeyConditionExpression: 'GSI1PK = :type',
        ExpressionAttributeValues: {
          ':type': `TYPE#${type}`,
        },
      });
    } else {
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pkPrefix)',
        ExpressionAttributeValues: {
          ':pkPrefix': 'EMP#',
        },
      });
    }

    const response = await docClient.send(command);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching employees:', err.message);
    console.error('Full error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      ...body,
      id,
      PK: `EMP#${id}`,
      SK: `EMP#${id}`,
      GSI1PK: `TYPE#${body.type}`,
      GSI1SK: `EMP#${id}`,
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
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
