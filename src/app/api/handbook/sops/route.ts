import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - all SOP / handbook documents
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'SOPS' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [] });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching SOPs:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch SOPs' }, { status: 500 });
  }
}

// POST - create a SOP entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();
    const item = {
      id,
      title: body.title,
      category: body.category || '',
      description: body.description || '',
      documents: body.documents || [],
      PK: `SOP#${id}`,
      SK: `SOP#${id}`,
      GSI1PK: 'SOPS',
      GSI1SK: `SOP#${now}`,
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating SOP:', error);
    return NextResponse.json({ success: false, error: 'Failed to create SOP' }, { status: 500 });
  }
}
