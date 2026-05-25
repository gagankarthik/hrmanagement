import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// Compute inclusive day count between two ISO date strings
function computeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diff = Math.round((endUtc - startUtc) / MS_PER_DAY);
  return diff >= 0 ? diff + 1 : 0;
}

// GET - Fetch all leaves
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :leavesKey',
      ExpressionAttributeValues: {
        ':leavesKey': 'LEAVES',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Leaves count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching leaves:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

// POST - Create new leave
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();
    const days = computeDays(body.startDate, body.endDate);

    const item = {
      id,
      employeeId: body.employeeId,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      days,
      reason: body.reason || '',
      status: body.status || 'Pending',
      appliedDate: now,
      documents: body.documents || [],
      PK: `LEAVE#${id}`,
      SK: `LEAVE#${id}`,
      GSI1PK: 'LEAVES',
      GSI1SK: `LEAVE#${now}`,
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
    console.error('Error creating leave:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create leave' },
      { status: 500 }
    );
  }
}
