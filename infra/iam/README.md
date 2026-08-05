# IAM for the HR portal server

`hr-portal-app-policy.json` is the least-privilege policy for the credentials the
portal runs under (`DYNAMODB_ACCESS_KEY_ID` / `DYNAMODB_SECRET_ACCESS_KEY`, which
also serve S3 and Cognito).

## Why this exists

As of 2026-08-04 the app was running under an IAM user carrying
`AdministratorAccess` and `FullBillingAccess`. A static access key with that
policy sits in `.env.local` and in the Amplify environment, so anything able to
read those values could delete every table in the account, read every bucket,
mint IAM users, or change billing. Nothing the portal does needs any of that.

This policy grants exactly what the code touches and nothing else:

- The `HRManagement-Employees` table and its indexes.
- `zenhr-documents-system` for document uploads.
- `oceanblue-backups-tables`, restricted to the `hr-employee-table-backups/`
  prefix, so the portal can never reach another app's backups in that shared
  bucket.
- The HR Cognito pool `us-east-2_IeDCRVfiW` only, which is what makes it
  impossible for this key to touch the company website's pool.

## Applying it

```bash
aws iam create-policy \
  --policy-name HRPortalAppLeastPrivilege \
  --policy-document file://infra/iam/hr-portal-app-policy.json

aws iam create-user --user-name hr-portal-app
aws iam attach-user-policy --user-name hr-portal-app \
  --policy-arn arn:aws:iam::417915984158:policy/HRPortalAppLeastPrivilege
aws iam create-access-key --user-name hr-portal-app
```

Put the new key into `.env.local` and the Amplify environment as
`DYNAMODB_ACCESS_KEY_ID` / `DYNAMODB_SECRET_ACCESS_KEY`, redeploy, and confirm
the Users page, document uploads and backups all still work. Only then delete
the old admin access key. Note the company website uses its own credentials and
is unaffected.

Better still, on Amplify: drop the static keys entirely and attach this policy
to the app's service role, so the SDK's default credential chain picks it up and
there is no long-lived secret to leak. `src/lib/dynamodb.ts` already falls back
to the default chain when no keys are set.

## Keeping it honest

If a new AWS call is added to the app, it must be added here too. A missing
permission surfaces as an `AccessDeniedException`, which the API routes already
translate into a readable message naming the missing action.
