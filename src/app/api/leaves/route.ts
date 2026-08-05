import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';
import { authorize, forbidden } from '@/shared/server/auth/guards';
import { getSelfEmployeeId, ownsRecord } from '@/shared/server/auth/self';

// Compute inclusive day count between two ISO date strings
function computeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diff = Math.round((endUtc - startUtc) / MS_PER_DAY);
  return diff >= 0 ? diff + 1 : 0;
}

// GET - Fetch leaves. HR/admin see every request; self-service users see only
// their own, filtered server-side so the browser never receives anyone else's.
export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    // All leaves share one GSI partition, and a Query returns at most 1MB per
    // call. Ignoring LastEvaluatedKey does not fail, it silently returns a
    // subset — so past a certain number of requests HR would be reviewing an
    // arbitrary slice of them. Follow the cursor to the end.
    // Ownership is deliberately NOT pushed into a FilterExpression. A leave is
    // the caller's if it carries their employee id or their login email, and
    // `ownsRecord` compares emails case-insensitively. DynamoDB cannot, and
    // requesterEmail is stored as HR typed it, so a server-side filter would
    // quietly drop a request whose email differs only in case. Hiding
    // somebody's own leave is a worse failure than reading a few extra rows.
    let items: Record<string, unknown>[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const response = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1-EmployeeType',
          KeyConditionExpression: 'GSI1PK = :leavesKey',
          ExpressionAttributeValues: { ':leavesKey': 'LEAVES' },
          ExclusiveStartKey: cursor,
        }),
      );
      items.push(...(response.Items || []));
      cursor = response.LastEvaluatedKey;
    } while (cursor);

    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      items = items.filter((item) => ownsRecord(item, auth.session, selfEmployeeId));
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching leaves:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

// POST - Create new leave
export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'user');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();
    const days = computeDays(body.startDate, body.endDate);

    // Self-service users may only file for themselves, and may never approve
    // their own request — identity and status come from the verified session,
    // not the request body.
    let employeeId = body.employeeId || '';
    let status = body.status || 'Pending';
    // Stored lowercased so ownership comparisons are consistent wherever they
    // happen, and so this could one day be matched server-side.
    let requesterEmail = (body.requesterEmail || '').toLowerCase().trim();
    let requesterName = body.requesterName || '';
    if (!auth.session.fullAccess) {
      const selfEmployeeId = await getSelfEmployeeId(auth.session);
      if (employeeId && employeeId !== selfEmployeeId) {
        return forbidden('You can only file leave for yourself.');
      }
      employeeId = selfEmployeeId || '';
      status = 'Pending';
      requesterEmail = auth.session.email;
      requesterName = auth.session.name || requesterName;
    }

    const item = {
      id,
      employeeId,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      days,
      reason: body.reason || '',
      status,
      appliedDate: now,
      documents: body.documents || [],
      // Self-service requester identity (employee ESS, no employee record).
      requesterEmail,
      requesterName,
      PK: `LEAVE#${id}`,
      SK: `LEAVE#${id}`,
      GSI1PK: 'LEAVES',
      GSI1SK: `LEAVE#${now}`,
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
    console.error('Error creating leave:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create leave' },
      { status: 500 }
    );
  }
}
