import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AddCustomAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  CreateGroupCommand,
  ListUsersCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';

import { INVITE_ROLE_OPTIONS, groupNameForRole, normalizeRole, type AppRole } from '@/config/access';

/**
 * Application roles an admin may assign from the Users page — the canonical list
 * lives in `src/config/access.ts` (client-safe) and is re-exported here for the
 * API routes. Each maps 1:1 to a Cognito group (`cognito:groups`). `employee` is
 * the invite-only ESS default.
 */
export { ROLE_LABELS as APP_ROLE_LABELS } from '@/config/access';
export type { AppRole } from '@/config/access';
export const APP_INVITE_ROLES: AppRole[] = [...INVITE_ROLE_OPTIONS];
const APP_ROLE_SET = new Set<string>(INVITE_ROLE_OPTIONS);

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
  /** Immutable Cognito user id — what an employee record links to. */
  sub?: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  status?: string;
  enabled: boolean;
  /** HR-portal access. Defaults to true when the attribute is unset. */
  hrAccess: boolean;
  /**
   * Assigned application role, mirrored to `custom:role` at invite/update time
   * so the Users table can show it without an AdminListGroupsForUser call per
   * user. The authoritative source for access is the Cognito group.
   */
  role?: AppRole;
  createdAt?: string;
  updatedAt?: string;
}

function attr(user: UserType, name: string): string | undefined {
  return user.Attributes?.find((a) => a.Name === name)?.Value;
}

function toAppUser(user: UserType): AppUser {
  // hr_access defaults to allowed unless explicitly set to 'false'.
  const access = attr(user, 'custom:hr_access');
  const roleAttr = (attr(user, 'custom:role') || '').toLowerCase().trim();
  return {
    username: user.Username || '',
    sub: attr(user, 'sub'),
    email: attr(user, 'email') || user.Username || '',
    name: attr(user, 'name'),
    phoneNumber: attr(user, 'phone_number'),
    status: user.UserStatus,
    enabled: user.Enabled ?? true,
    hrAccess: access !== 'false',
    role: normalizeRole(roleAttr) ?? undefined,
    createdAt: user.UserCreateDate ? user.UserCreateDate.toISOString() : undefined,
    updatedAt: user.UserLastModifiedDate ? user.UserLastModifiedDate.toISOString() : undefined,
  };
}

/**
 * A user's current application role, read from their live Cognito group
 * membership — the authoritative source for access, and what the OceanBlue site
 * writes to as well. When a user is in several role groups, the highest-privilege
 * one is shown. Returns undefined if they hold no app-role group. Best-effort:
 * resolves to undefined on error so one failure never breaks the whole list.
 */
const ROLE_DISPLAY_PRIORITY: AppRole[] = ['admin', 'hr', 'employee'];
export async function groupRoleFor(username: string): Promise<AppRole | undefined> {
  try {
    const res = await client.send(
      new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: username }),
    );
    const owned = new Set<string>(
      (res.Groups || [])
        .map((g) => normalizeRole(g.GroupName))
        .filter((r): r is AppRole => r !== null),
    );
    return ROLE_DISPLAY_PRIORITY.find((r) => owned.has(r));
  } catch {
    return undefined;
  }
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

  // Enrich each user's role from their live group membership (authoritative),
  // overriding the mirrored `custom:role`. Bounded concurrency to avoid Cognito
  // AdminListGroupsForUser throttling on larger pools.
  const CONCURRENCY = 12;
  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const chunk = users.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (u) => {
        const groupRole = await groupRoleFor(u.username);
        if (groupRole) u.role = groupRole;
      }),
    );
  }

  return users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Invite a user: creates the account and lets Cognito email the temporary
 * password (DesiredDeliveryMediums EMAIL). The invitee then signs in and
 * completes the FORCE_CHANGE_PASSWORD challenge (name + phone + new password).
 * Pass `resend: true` to re-send the invitation to an existing pending user.
 *
 * `role` (default `employee`) is assigned as a Cognito group so the invitee
 * lands in the right access tier on first sign-in — without it a new user has
 * no group and is blocked by the HR portal's access policy.
 */
export async function inviteUser({
  email,
  name,
  role = 'employee',
  resend = false,
}: {
  email: string;
  name?: string;
  role?: AppRole;
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

  // A resend targets an existing user whose role is already set — don't touch it.
  if (!resend && APP_ROLE_SET.has(role)) {
    await setUserRole(email, role);
  }

  const invited = res.User ? toAppUser(res.User) : { username: email, email, enabled: true, hrAccess: true };
  return { ...invited, role };
}

/**
 * Cognito group name written for an app role, namespaced per application
 * (`hr:admin`). Reads still accept the legacy bare names, so members created
 * before the namespace keep their access.
 */
function roleGroupName(role: AppRole): string {
  return groupNameForRole(role);
}

/** True if a group name grants one of THIS app's roles, prefixed or legacy. */
function isAppRoleGroup(groupName: string): boolean {
  return normalizeRole(groupName) !== null;
}

/** Ensure a Cognito group exists (best-effort; ignore if it already does). */
async function ensureGroup(groupName: string): Promise<void> {
  try {
    await client.send(new CreateGroupCommand({ UserPoolId: USER_POOL_ID, GroupName: groupName }));
  } catch {
    // Group very likely already exists — safe to ignore.
  }
}

/**
 * Set a user's application role: ensures the target Cognito group exists, adds
 * the user to it, removes any *other* app-role groups so exactly one role is
 * active, and mirrors the role to `custom:role` for cheap display in the Users
 * table. The Cognito group remains the authoritative source for access tiers.
 */
export async function setUserRole(username: string, role: AppRole): Promise<void> {
  const target = roleGroupName(role);
  await ensureGroup(target);
  await client.send(
    new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: target }),
  );

  // Remove any stale app-role groups so the user holds exactly one role.
  try {
    const groups = await client.send(
      new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: username }),
    );
    // Every other group that would grant a role in THIS app has to go, legacy
    // bare names included — otherwise a demotion leaves the old grant standing
    // and the reader, which accepts both forms, still sees the old role.
    const stale = (groups.Groups || [])
      .map((g) => g.GroupName || '')
      .filter((g) => g && g !== target && isAppRoleGroup(g));
    await Promise.all(
      stale.map((g) =>
        client.send(
          new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: g }),
        ),
      ),
    );
  } catch {
    // Listing/removing is best-effort cleanup; the add above is what grants access.
  }

  // Mirror to custom:role (display only). Best-effort — never fail the whole op.
  try {
    await updateUserMeta(username, { role });
  } catch {
    /* noop */
  }
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
 * Update HR-portal metadata on a Cognito user: their role and whether they may
 * use the HR portal (custom:hr_access). It is a soft block that leaves the
 * account intact, which is why it is separate from disabling the user. If the
 * custom attributes aren't in the pool schema yet, we add them once and retry.
 */
export async function updateUserMeta(
  username: string,
  meta: { hrAccess?: boolean; role?: AppRole },
): Promise<void> {
  const attrs: { Name: string; Value: string }[] = [];
  if (meta.hrAccess !== undefined) {
    attrs.push({ Name: 'custom:hr_access', Value: meta.hrAccess ? 'true' : 'false' });
  }
  if (meta.role !== undefined) {
    attrs.push({ Name: 'custom:role', Value: meta.role });
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
