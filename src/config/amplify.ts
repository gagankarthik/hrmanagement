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

/**
 * Refresh token validity on the Cognito app client, in days. Keep this in step
 * with the pool: `describe-user-pool-client → RefreshTokenValidity`.
 */
const REFRESH_TOKEN_DAYS = 5;

export function configureAmplify() {
  Amplify.configure(amplifyConfig);

  // Store Cognito tokens in cookies (instead of localStorage) so they are sent
  // on same-origin requests to /api/*. `secure` is enabled only over HTTPS so
  // local http dev still works.
  //
  // HOST-ONLY, deliberately. This portal runs on its own Cognito user pool,
  // separate from the company website, and the session must not travel between
  // the two. Omitting `domain` scopes every cookie to the exact host it was set
  // on, so nothing is readable from oceanbluecorp.com or any sibling subdomain.
  // There is no cross-site SSO: signing in here is always an explicit login.
  if (typeof window !== 'undefined') {
    const secure = window.location.protocol === 'https:';

    // One-time cleanup for anyone carrying cookies from the shared-pool era.
    // Those were scoped to `.oceanbluecorp.com` and keyed by the old app
    // client, so Amplify ignores them now, but they would otherwise sit in the
    // browser holding a live token for the website's pool until they expire.
    purgeSharedDomainCognitoCookies();

    // Cookie lifetime tracks the app client's refresh token validity (5 days).
    // A longer cookie is worse than useless: the browser keeps presenting a
    // session whose refresh token Cognito has already expired, so the user
    // looks signed in until the first API call bounces them to the login page.
    cognitoUserPoolsTokenProvider.setKeyValueStorage(
      new CookieStorage({ path: '/', sameSite: 'lax', secure, expires: REFRESH_TOKEN_DAYS }),
    );
  }
}

/**
 * Expire any `CognitoIdentityServiceProvider.*` cookie scoped to the shared
 * parent domain, left over from when this portal and the company website ran on
 * one pool and one app client. Deleting with `Domain=.oceanbluecorp.com` matches
 * only that shared variant; the host-only cookies this app now writes carry no
 * Domain attribute and are untouched.
 */
function purgeSharedDomainCognitoCookies() {
  try {
    const host = window.location.hostname;
    if (host !== 'oceanbluecorp.com' && !host.endsWith('.oceanbluecorp.com')) return;

    const names = new Set(
      document.cookie
        .split('; ')
        .map((c) => c.split('=')[0])
        .filter((n) => n.startsWith('CognitoIdentityServiceProvider.')),
    );
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    names.forEach((name) => {
      document.cookie =
        `${name}=; Path=/; Domain=.oceanbluecorp.com; ` +
        `Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
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
