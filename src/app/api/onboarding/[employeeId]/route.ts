import { NextRequest, NextResponse } from 'next/server';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize } from '@/shared/server/auth/guards';

export async function GET(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { employeeId } = await params;
    const response = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK: `ONBOARD#${employeeId}`, SK: `ONBOARD#${employeeId}` } }),
    );
    if (!response.Item) {
      return NextResponse.json({ success: false, error: 'Onboarding packet not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: response.Item });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch onboarding packet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await authorize(request, 'full');
  if (!auth.ok) return auth.response;

  try {
    const { employeeId } = await params;
    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `ONBOARD#${employeeId}`, SK: `ONBOARD#${employeeId}` } }),
    );
    return NextResponse.json({ success: true, message: 'Onboarding packet deleted' });
  } catch (error) {
    console.error('Error deleting onboarding packet:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete onboarding packet' }, { status: 500 });
  }
}
