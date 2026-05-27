import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - all I-9 records
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'I9S' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [], count: response.Items?.length || 0 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching I-9 records:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch I-9 records' }, { status: 500 });
  }
}

// POST - upsert an I-9 record keyed by employeeId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employeeId = body.employeeId;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }
    const now = new Date().toISOString();

    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `I9#${employeeId}`, SK: `I9#${employeeId}` } }));

    const item = {
      ...(existing.Item || {}),
      ...body,
      employeeId,
      documents: Array.isArray(body.documents) ? body.documents : [],
      auditTrail: Array.isArray(body.auditTrail) ? body.auditTrail : [],
      everifyStatus: body.everifyStatus || 'Not submitted',
      PK: `I9#${employeeId}`,
      SK: `I9#${employeeId}`,
      GSI1PK: 'I9S',
      GSI1SK: `I9#${now}`,
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving I-9 record:', error);
    return NextResponse.json({ success: false, error: 'Failed to save I-9 record' }, { status: 500 });
  }
}
