import { Amplify } from 'aws-amplify';

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
};

// AWS Amplify Configuration (Cognito only - no Identity Pool)
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || 'us-east-2_U2MoiBT97',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '4vlsvgqif8tpeqtdqmvbfs5uok',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig);
}

export default amplifyConfig;

// DynamoDB Table Names
export const DYNAMODB_TABLES = {
  EMPLOYEES: process.env.NEXT_PUBLIC_EMPLOYEES_TABLE || 'HRManagement-Employees',
};

// Employee type to DynamoDB partition key mapping
export const EMPLOYEE_TYPE_PK = {
  W2: 'EMP#W2',
  Contract: 'EMP#CONTRACT',
  '1099': 'EMP#1099',
  Offshore: 'EMP#OFFSHORE',
};
