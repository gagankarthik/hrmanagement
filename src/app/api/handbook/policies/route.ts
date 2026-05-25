import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - all category policies
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'POLICIES' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [] });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching policies:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch policies' }, { status: 500 });
  }
}

// PUT - upsert one category policy (keyed by employeeType)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body.employeeType);
    if (!type) return NextResponse.json({ success: false, error: 'employeeType is required' }, { status: 400 });
    const now = new Date().toISOString();

    const item = {
      employeeType: type,
      annualLeaveAllowance: Number(body.annualLeaveAllowance) || 0,
      rules: body.rules || '',
      documents: body.documents || [],
      PK: `POLICY#${type}`,
      SK: `POLICY#${type}`,
      GSI1PK: 'POLICIES',
      GSI1SK: `POLICY#${type}`,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving policy:', error);
    return NextResponse.json({ success: false, error: 'Failed to save policy' }, { status: 500 });
  }
}
