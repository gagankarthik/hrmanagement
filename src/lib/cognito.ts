import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';

// SERVER-ONLY MODULE. Never import from a Client Component — it reads AWS
// credentials. Reuses the same non-public credential env vars as the DynamoDB
// client; with no static keys the SDK default provider chain (execution role)
// is used. The User Pool id falls back to the public NEXT_PUBLIC value.
const region =
  process.env.DYNAMODB_REGION ||
  process.env.APP_AWS_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-2';

const accessKeyId =
  process.env.DYNAMODB_ACCESS_KEY_ID ||
  process.env.APP_AWS_ACCESS_KEY_ID ||
  process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.DYNAMODB_SECRET_ACCESS_KEY ||
  process.env.APP_AWS_SECRET_ACCESS_KEY ||
  process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

// Server override (AWS_USER_POOL_ID) falls back to the public canonical var.
// No hardcoded fallback — a missing value fails loudly instead of silently
// using the wrong pool.
export const USER_POOL_ID =
  process.env.AWS_USER_POOL_ID ||
  process.env.NEXT_PUBLIC_AWS_USER_POOL_ID ||
  '';

const client = new CognitoIdentityProviderClient({
  region,
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
    : {}),
});

export interface AppUser {
  username: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  status?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function attr(user: UserType, name: string): string | undefined {
  return user.Attributes?.find((a) => a.Name === name)?.Value;
}

function toAppUser(user: UserType): AppUser {
  return {
    username: user.Username || '',
    email: attr(user, 'email') || user.Username || '',
    name: attr(user, 'name'),
    phoneNumber: attr(user, 'phone_number'),
    status: user.UserStatus,
    enabled: user.Enabled ?? true,
    createdAt: user.UserCreateDate ? user.UserCreateDate.toISOString() : undefined,
    updatedAt: user.UserLastModifiedDate ? user.UserLastModifiedDate.toISOString() : undefined,
  };
}

/** List all users in the pool (paginates up to a reasonable limit). */
export async function listUsers(): Promise<AppUser[]> {
  const users: AppUser[] = [];
  let paginationToken: string | undefined;
  do {
    const res = await client.send(
      new ListUsersCommand({ UserPoolId: USER_POOL_ID, Limit: 60, PaginationToken: paginationToken }),
    );
    (res.Users || []).forEach((u) => users.push(toAppUser(u)));
    paginationToken = res.PaginationToken;
  } while (paginationToken && users.length < 600);
  return users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Invite a user: creates the account and lets Cognito email the temporary
 * password (DesiredDeliveryMediums EMAIL). The invitee then signs in and
 * completes the FORCE_CHANGE_PASSWORD challenge (name + phone + new password).
 * Pass `resend: true` to re-send the invitation to an existing pending user.
 */
export async function inviteUser({
  email,
  name,
  resend = false,
}: {
  email: string;
  name?: string;
  resend?: boolean;
}): Promise<AppUser> {
  const userAttributes: { Name: string; Value: string }[] = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' },
  ];
  if (name && name.trim()) userAttributes.push({ Name: 'name', Value: name.trim() });

  const res = await client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
      DesiredDeliveryMediums: ['EMAIL'],
      ...(resend ? { MessageAction: 'RESEND' } : {}),
    }),
  );
  return res.User ? toAppUser(res.User) : { username: email, email, enabled: true };
}

/** Remove a user from the pool. */
export async function deleteUser(username: string): Promise<void> {
  await client.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
}
