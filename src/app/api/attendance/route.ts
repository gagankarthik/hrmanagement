import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all attendance records
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :attKey',
      ExpressionAttributeValues: {
        ':attKey': 'ATTENDANCE',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Attendance count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
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

// POST - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      id,
      employeeId: body.employeeId,
      date: body.date,
      status: body.status || 'Present',
      checkIn: body.checkIn || '',
      checkOut: body.checkOut || '',
      note: body.note || '',
      PK: `ATT#${id}`,
      SK: `ATT#${id}`,
      GSI1PK: 'ATTENDANCE',
      GSI1SK: `ATT#${now}`,
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
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attendance' },
      { status: 500 }
    );
  }
}
