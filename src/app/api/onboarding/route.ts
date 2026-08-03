import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize } from '@/shared/server/auth/guards';

// GET - all onboarding packet records
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'ONBOARD' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [], count: response.Items?.length || 0 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching onboarding packets:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch onboarding packets' }, { status: 500 });
  }
}

// POST - upsert an onboarding packet keyed by employeeId
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const employeeId = body.employeeId;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }
    const now = new Date().toISOString();

    const existing = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK: `ONBOARD#${employeeId}`, SK: `ONBOARD#${employeeId}` } }),
    );

    const item = {
      ...(existing.Item || {}),
      ...body,
      employeeId,
      items: Array.isArray(body.items) ? body.items : [],
      PK: `ONBOARD#${employeeId}`,
      SK: `ONBOARD#${employeeId}`,
      GSI1PK: 'ONBOARD',
      GSI1SK: `ONBOARD#${now}`,
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving onboarding packet:', error);
    return NextResponse.json({ success: false, error: 'Failed to save onboarding packet' }, { status: 500 });
  }
}
