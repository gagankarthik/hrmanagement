import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all invoices
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'INVOICES' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [], count: response.Items?.length || 0 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching invoices:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();
    const d = new Date();
    const invoiceNumber =
      body.invoiceNumber ||
      `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${id.slice(0, 4).toUpperCase()}`;

    const item = {
      id,
      invoiceNumber,
      clientId: body.clientId || '',
      clientName: body.clientName || '',
      periodStart: body.periodStart || '',
      periodEnd: body.periodEnd || '',
      issueDate: body.issueDate || now.slice(0, 10),
      dueDate: body.dueDate || '',
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
      subtotal: Number(body.subtotal) || 0,
      total: Number(body.total) || 0,
      status: body.status || 'Draft',
      notes: body.notes || '',
      PK: `INV#${id}`,
      SK: `INV#${id}`,
      GSI1PK: 'INVOICES',
      GSI1SK: `INV#${body.issueDate || now.slice(0, 10)}#${id}`,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
  }
}
