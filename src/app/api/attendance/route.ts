import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId } from '@/shared/server/auth/self';

// GET - Fetch attendance. HR/admin see everyone; self-service users get only
// their own days, filtered server-side.
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :attKey',
      ExpressionAttributeValues: {
        ':attKey': 'ATTENDANCE',
      },
    });

    const response = await docClient.send(command);

    let items = response.Items || [];
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      items = selfEmployeeId ? items.filter((item) => item.employeeId === selfEmployeeId) : [];
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching attendance:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST - Create new attendance record
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Self-service users clock themselves in and nobody else.
    let employeeId = body.employeeId || '';
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      if (!selfEmployeeId) {
        return forbidden('Your account is not linked to an employee record yet.');
      }
      if (employeeId && employeeId !== selfEmployeeId) {
        return forbidden('You can only mark your own attendance.');
      }
      employeeId = selfEmployeeId;
    }

    const item = {
      id,
      employeeId,
      date: body.date,
      status: body.status || 'Present',
      checkIn: body.checkIn || '',
      checkOut: body.checkOut || '',
      note: body.note || '',
      PK: `ATT#${id}`,
      SK: `ATT#${id}`,
      GSI1PK: 'ATTENDANCE',
      GSI1SK: `ATT#${now}`,
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
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attendance' },
      { status: 500 }
    );
  }
}
