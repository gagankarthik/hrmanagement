import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';

// NOTE: AWS access keys must NEVER live in this file. It is imported by client
// components (Amplify Cognito setup), so anything referenced here is bundled
// into the browser. Server-side DynamoDB credentials live in `src/lib/dynamodb.ts`
// (server-only) and are read from non-public env vars. Only the public Cognito
// config below is safe to expose.

// AWS Amplify Configuration (Cognito only - no Identity Pool)
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '',
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

  // Store Cognito tokens in cookies (instead of localStorage) so they are sent
  // on same-origin requests to /api/* and can be verified by the Edge
  // middleware. `secure` is enabled only over HTTPS so local http dev still works.
  if (typeof window !== 'undefined') {
    const secure = window.location.protocol === 'https:';
    cognitoUserPoolsTokenProvider.setKeyValueStorage(
      new CookieStorage({ path: '/', sameSite: 'lax', secure, expires: 30 }),
    );
  }
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
