import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AddCustomAttributesCommand,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';

/** Employee classification stored on the Cognito user (display/category only). */
export type UserEmployeeType = 'W2' | 'Contract' | '1099' | 'Offshore';
export const USER_EMPLOYEE_TYPES: UserEmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];

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
  /** HR-portal employee classification (custom:employee_type). */
  employeeType?: UserEmployeeType;
  /** HR-portal access. Defaults to true when the attribute is unset. */
  hrAccess: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function attr(user: UserType, name: string): string | undefined {
  return user.Attributes?.find((a) => a.Name === name)?.Value;
}

function toAppUser(user: UserType): AppUser {
  const empType = attr(user, 'custom:employee_type');
  // hr_access defaults to allowed unless explicitly set to 'false'.
  const access = attr(user, 'custom:hr_access');
  return {
    username: user.Username || '',
    email: attr(user, 'email') || user.Username || '',
    name: attr(user, 'name'),
    phoneNumber: attr(user, 'phone_number'),
    status: user.UserStatus,
    enabled: user.Enabled ?? true,
    employeeType: (USER_EMPLOYEE_TYPES as string[]).includes(empType || '')
      ? (empType as UserEmployeeType)
      : undefined,
    hrAccess: access !== 'false',
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
  return res.User ? toAppUser(res.User) : { username: email, email, enabled: true, hrAccess: true };
}

/** Remove a user from the pool. */
export async function deleteUser(username: string): Promise<void> {
  await client.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
}

/** True when an update failed because a custom attribute isn't in the pool schema. */
function isMissingSchemaAttr(err: unknown): boolean {
  const e = err as { name?: string; message?: string };
  return (
    e?.name === 'InvalidParameterException' &&
    !!e.message &&
    /schema|attribute.*does not exist/i.test(e.message)
  );
}

/**
 * Ensure the given `custom:*` attributes exist in the pool schema, adding any
 * that are missing. Best-effort: an already-present attribute throws and is
 * ignored. Requires `cognito-idp:AddCustomAttributes` on the server role.
 */
async function ensureCustomAttributes(names: string[]): Promise<void> {
  const custom = names
    .filter((n) => n.startsWith('custom:'))
    .map((n) => ({ Name: n.slice('custom:'.length), AttributeDataType: 'String' as const, Mutable: true }));
  if (custom.length === 0) return;
  try {
    await client.send(
      new AddCustomAttributesCommand({ UserPoolId: USER_POOL_ID, CustomAttributes: custom }),
    );
  } catch {
    // Attribute(s) likely already exist — safe to ignore and let the retry run.
  }
}

/**
 * Update HR-portal metadata on a Cognito user: employee classification and/or
 * whether they may use the HR portal (custom:hr_access). These attributes are
 * read only by the HR portal — the company website ignores them, so toggling
 * access here never affects the marketing-site login. If the custom attributes
 * aren't in the pool schema yet, we add them once and retry.
 */
export async function updateUserMeta(
  username: string,
  meta: { employeeType?: UserEmployeeType | null; hrAccess?: boolean },
): Promise<void> {
  const attrs: { Name: string; Value: string }[] = [];
  if (meta.employeeType !== undefined) {
    attrs.push({ Name: 'custom:employee_type', Value: meta.employeeType ?? '' });
  }
  if (meta.hrAccess !== undefined) {
    attrs.push({ Name: 'custom:hr_access', Value: meta.hrAccess ? 'true' : 'false' });
  }
  if (attrs.length === 0) return;

  const send = () =>
    client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: attrs,
      }),
    );

  try {
    await send();
  } catch (err) {
    if (isMissingSchemaAttr(err)) {
      await ensureCustomAttributes(attrs.map((a) => a.Name));
      await send();
      return;
    }
    throw err;
  }
}
