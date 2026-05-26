import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all timesheets
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'TIMESHEETS' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [], count: response.Items?.length || 0 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching timesheets:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch timesheets' }, { status: 500 });
  }
}

// POST - Create timesheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      id,
      employeeId: body.employeeId || '',
      employeeName: body.employeeName || '',
      clientId: body.clientId || '',
      clientName: body.clientName || '',
      periodStart: body.periodStart || '',
      periodEnd: body.periodEnd || '',
      hours: Number(body.hours) || 0,
      billRate: Number(body.billRate) || 0,
      payRate: Number(body.payRate) || 0,
      status: body.status || 'Draft',
      notes: body.notes || '',
      PK: `TS#${id}`,
      SK: `TS#${id}`,
      GSI1PK: 'TIMESHEETS',
      GSI1SK: `TS#${body.periodStart || now}#${id}`,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ success: false, error: 'Failed to create timesheet' }, { status: 500 });
  }
}
