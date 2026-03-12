import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Employee, EmployeeType } from '@/types/employee';

// Initialize DynamoDB Client with IAM credentials
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.NEXT_PUBLIC_EMPLOYEES_TABLE || 'HRManagement-Employees';

// Fetch all employees
export async function fetchAllEmployees(): Promise<Employee[]> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const response = await docClient.send(command);
    return (response.Items || []) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
}

// Fetch employees by type
export async function fetchEmployeesByType(type: EmployeeType): Promise<Employee[]> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmployeeType',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: {
        ':type': `TYPE#${type}`,
      },
    });

    const response = await docClient.send(command);
    return (response.Items || []) as Employee[];
  } catch (error) {
    console.error('Error fetching employees by type:', error);
    throw error;
  }
}

// Get single employee by ID
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMP#${id}`,
        SK: `EMP#${id}`,
      },
    });

    const response = await docClient.send(command);
    return (response.Item as Employee) || null;
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
}

// Create new employee
export async function createEmployee(
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    const status = 'status' in employeeData ? employeeData.status : 'Active';

    const item = {
      ...employeeData,
      id,
      PK: `EMP#${id}`,
      SK: `EMP#${id}`,
      GSI1PK: `TYPE#${employeeData.type}`,
      GSI1SK: `EMP#${id}`,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);
    return item as unknown as Employee;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
}

// Update employee
export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee> {
  try {
    const now = new Date().toISOString();

    // First get the existing employee
    const existing = await getEmployeeById(id);
    if (!existing) {
      throw new Error('Employee not found');
    }

    const updatedEmployee = {
      ...existing,
      ...updates,
      id,
      PK: `EMP#${id}`,
      SK: `EMP#${id}`,
      GSI1PK: `TYPE#${updates.type || existing.type}`,
      GSI1SK: `EMP#${id}`,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedEmployee,
    });

    await docClient.send(command);
    return updatedEmployee as unknown as Employee;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
}

// Delete employee
export async function deleteEmployee(id: string): Promise<void> {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMP#${id}`,
        SK: `EMP#${id}`,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
}

// Check if DynamoDB is configured
export function isDynamoDBConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID &&
    process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY &&
    process.env.NEXT_PUBLIC_AWS_REGION
  );
}
