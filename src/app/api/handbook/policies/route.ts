import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '@/lib/dynamodb';

// GET - all category policies
export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :k',
      ExpressionAttributeValues: { ':k': 'POLICIES' },
    });
    const response = await docClient.send(command);
    return NextResponse.json({ success: true, data: response.Items || [] });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching policies:', err.message);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch policies' }, { status: 500 });
  }
}

// PUT - upsert one category policy (keyed by employeeType)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body.employeeType);
    if (!type) return NextResponse.json({ success: false, error: 'employeeType is required' }, { status: 400 });
    const now = new Date().toISOString();

    // DynamoDB rejects `undefined`, so coerce optional values to null.
    const optNum = (v: unknown): number | null =>
      v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);
    const optStr = (v: unknown): string | null =>
      v === undefined || v === null || v === '' ? null : String(v);

    // Normalize accrual tiers, dropping undefined fields to null.
    const accrualTiers = Array.isArray(body.accrualTiers)
      ? body.accrualTiers.map((t: Record<string, unknown>) => ({
          label: optStr(t?.label),
          minYears: Number(t?.minYears) || 0,
          maxYears: optNum(t?.maxYears),
          monthlyHours: optNum(t?.monthlyHours),
          annualDays: optNum(t?.annualDays),
        }))
      : [];

    const item = {
      employeeType: type,
      definition: optStr(body.definition),
      eligible: body.eligible === undefined ? true : Boolean(body.eligible),
      proRata: Boolean(body.proRata),
      annualLeaveAllowance: Number(body.annualLeaveAllowance) || 0,
      entitlementWeeks: optNum(body.entitlementWeeks),
      accrualTiers,
      noticeStandardWeeks: optNum(body.noticeStandardWeeks),
      noticeExtendedWeeks: optNum(body.noticeExtendedWeeks),
      carryOverCapDays: optNum(body.carryOverCapDays),
      cashOutMaxDays: optNum(body.cashOutMaxDays),
      minUsageDays: optNum(body.minUsageDays),
      publicHolidayNotDeducted: Boolean(body.publicHolidayNotDeducted),
      documentationRequired: optStr(body.documentationRequired),
      rules: body.rules || '',
      documents: body.documents || [],
      PK: `POLICY#${type}`,
      SK: `POLICY#${type}`,
      GSI1PK: 'POLICIES',
      GSI1SK: `POLICY#${type}`,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving policy:', error);
    return NextResponse.json({ success: false, error: 'Failed to save policy' }, { status: 500 });
  }
}
