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
    const shared = host === 'oceanbluecorp.com' || host.endsWith('.oceanbluecorp.com');
    const domain = shared ? '.oceanbluecorp.com' : undefined; // localhost/preview → host-only

    // Remove stale HOST-ONLY Cognito cookies BEFORE Amplify reads anything. A
    // user who previously signed in to the HR portal directly (host-only scope)
    // ends up with two cookies per key once the shared `.oceanbluecorp.com`
    // cookies arrive; js-cookie returns the first/oldest, so Amplify would read
    // the dead host-only session and bounce to login. Purging the host-only
    // variant leaves only the shared session. No-op when no duplicates exist.
    if (shared) purgeHostOnlyCognitoCookies();

    cognitoUserPoolsTokenProvider.setKeyValueStorage(
      new CookieStorage({ domain, path: '/', sameSite: 'lax', secure, expires: 30 }),
    );
  }
}

/**
 * Expire any host-only `CognitoIdentityServiceProvider.*` cookies (those set
 * without a Domain attribute, i.e. scoped to the exact host). Deleting without
 * a Domain only matches the host-only variant — the shared `.oceanbluecorp.com`
 * cookie has an explicit Domain and is left intact.
 */
function purgeHostOnlyCognitoCookies() {
  try {
    const names = new Set(
      document.cookie
        .split('; ')
        .map((c) => c.split('=')[0])
        .filter((n) => n.startsWith('CognitoIdentityServiceProvider.')),
    );
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    names.forEach((name) => {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
    });
  } catch {
    /* noop */
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
