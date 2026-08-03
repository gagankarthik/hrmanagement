import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';

// GET - employee document records. Self-service users receive only their own
// folder; HR receives every record.
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'EMPDOCS' },
    });
    const response = await docClient.send(command);
    let items = response.Items || [];
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      items = selfEmployeeId ? items.filter((item) => item.employeeId === selfEmployeeId) : [];
    }
    return NextResponse.json({ success: true, data: items, count: items.length });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching employee document records:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch employee document records' }, { status: 500 });
  }
}

// POST - upsert an employee document record keyed by employeeId (HR only —
// people cannot add or replace documents in their own file)
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

    const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: `EMPDOCS#${employeeId}`, SK: `EMPDOCS#${employeeId}` } }));

    const item = {
      ...(existing.Item || {}),
      ...body,
      employeeId,
      documents: Array.isArray(body.documents) ? body.documents : [],
      PK: `EMPDOCS#${employeeId}`,
      SK: `EMPDOCS#${employeeId}`,
      GSI1PK: 'EMPDOCS',
      GSI1SK: `EMPDOCS#${now}`,
      createdAt: existing.Item?.createdAt || now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving employee document record:', error);
    return NextResponse.json({ success: false, error: 'Failed to save employee document record' }, { status: 500 });
  }
}
