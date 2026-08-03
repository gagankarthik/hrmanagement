'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * `fetch` for our own API, with the session attached.
 *
 * Two things travel with every call: the Cognito cookies the browser sends on
 * its own, and an explicit `Authorization: Bearer <idToken>` from
 * `fetchAuthSession()`, which hands back the cached token and silently renews it
 * when it is close to expiry. The header is what makes this reliable — a stale
 * cookie is no longer the only proof of identity the server has, which is what
 * broke the earlier attempt at server-side API auth.
 *
 * On a 401 the session is force-refreshed and the request replayed exactly
 * once, so a tab left open overnight recovers instead of erroring.
 *
 * Use it only for same-origin `/api/*` calls. Never for presigned S3 URLs — an
 * extra Authorization header there breaks the signature.
 */
async function withAuthHeader(init?: RequestInit, forceRefresh = false): Promise<RequestInit> {
  const headers = new Headers(init?.headers);
  try {
    const { tokens } = await fetchAuthSession(forceRefresh ? { forceRefresh: true } : undefined);
    const token = tokens?.idToken?.toString() ?? tokens?.accessToken?.toString();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // Signed out or offline — let the request go and the server answer 401.
  }
  return { ...init, headers };
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, await withAuthHeader(init));
  if (res.status !== 401) return res;

  try {
    return await fetch(input, await withAuthHeader(init, true));
  } catch {
    return res;
  }
}
