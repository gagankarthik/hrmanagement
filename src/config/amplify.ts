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
  // on same-origin requests to /api/*. `secure` is enabled only over HTTPS so
  // local http dev still works.
  //
  // SSO: when served from an *.oceanbluecorp.com host we scope the cookie to the
  // parent domain (`.oceanbluecorp.com`). The marketing site (oceanbluecorp.com)
  // writes the same Cognito cookies (same User Pool + App Client) on that parent
  // domain at login, so Amplify here picks up the session automatically — the
  // user lands signed-in without re-entering credentials. Visiting the HR portal
  // directly with no shared cookie still shows the login screen.
  if (typeof window !== 'undefined') {
    const secure = window.location.protocol === 'https:';
    const host = window.location.hostname;
    const domain = host === 'oceanbluecorp.com' || host.endsWith('.oceanbluecorp.com')
      ? '.oceanbluecorp.com'
      : undefined; // localhost / preview hosts → host-only cookie
    cognitoUserPoolsTokenProvider.setKeyValueStorage(
      new CookieStorage({ domain, path: '/', sameSite: 'lax', secure, expires: 30 }),
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
