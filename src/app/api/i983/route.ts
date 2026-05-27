import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - all I-983 records
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'I983S' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [], count: response.Items?.length || 0 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching I-983 records:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch I-983 records' }, { status: 500 });
  }
}

// POST - upsert an I-983 record keyed by employeeId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employeeId = body.employeeId;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }
    const now = new Date().toISOString();

    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `I983#${employeeId}`, SK: `I983#${employeeId}` } }));

    const item = {
      ...(existing.Item || {}),
      ...body,
      employeeId,
      materialChanges: Array.isArray(body.materialChanges) ? body.materialChanges : [],
      documents: Array.isArray(body.documents) ? body.documents : [],
      auditTrail: Array.isArray(body.auditTrail) ? body.auditTrail : [],
      eval12: body.eval12 && typeof body.eval12 === 'object' ? body.eval12 : {},
      eval24: body.eval24 && typeof body.eval24 === 'object' ? body.eval24 : {},
      PK: `I983#${employeeId}`,
      SK: `I983#${employeeId}`,
      GSI1PK: 'I983S',
      GSI1SK: `I983#${now}`,
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving I-983 record:', error);
    return NextResponse.json({ success: false, error: 'Failed to save I-983 record' }, { status: 500 });
  }
}
