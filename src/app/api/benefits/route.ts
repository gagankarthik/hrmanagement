import { NextRequest, NextResponse } from 'next/server';
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - Fetch all benefit plans
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :benefitsKey',
      ExpressionAttributeValues: {
        ':benefitsKey': 'BENEFITS',
      },
    });

    const response = await docClient.send(command);

    console.log('DynamoDB response - Benefits count:', response.Items?.length || 0);

    return NextResponse.json({
      success: true,
      data: response.Items || [],
      count: response.Items?.length || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching benefits:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch benefits' },
      { status: 500 }
    );
  }
}

// POST - Create new benefit plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      id,
      name: body.name,
      type: body.type || 'Other',
      provider: body.provider || '',
      eligibility: Array.isArray(body.eligibility) ? body.eligibility : [],
      costPerMonth: typeof body.costPerMonth === 'number' ? body.costPerMonth : null,
      employerContribution: typeof body.employerContribution === 'number' ? body.employerContribution : null,
      description: body.description || '',
      documents: Array.isArray(body.documents) ? body.documents : [],
      enrolledEmployeeIds: Array.isArray(body.enrolledEmployeeIds) ? body.enrolledEmployeeIds : [],
      status: body.status || 'Active',
      PK: `BENEFIT#${id}`,
      SK: `BENEFIT#${id}`,
      GSI1PK: 'BENEFITS',
      GSI1SK: `BENEFIT#${now}`,
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
    console.error('Error creating benefit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create benefit' },
      { status: 500 }
    );
  }
}
