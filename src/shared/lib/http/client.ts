/**
 * Typed browser → API client.
 *
 * Owns the `{ success, data, error }` envelope and fetch plumbing that was
 * previously copy-pasted into every React context. Feature API clients build on
 * this so contexts can shrink to thin server-state holders.
 *
 * On a non-success envelope (or network error) it throws, so callers use plain
 * try/catch instead of branching on `result.success` everywhere.
 */

export interface ApiError extends Error {
  status?: number;
}

type SuccessEnvelope<T> = { success: true; data: T } & Record<string, unknown>;
type FailureEnvelope = { success: false; error?: string };

function makeError(message: string, status?: number): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw makeError('Network error — please check your connection and try again.');
  }

  let json: SuccessEnvelope<T> | FailureEnvelope;
  try {
    json = await res.json();
  } catch {
    throw makeError(`Unexpected response from server (${res.status}).`, res.status);
  }

  if (!res.ok || !json || json.success === false) {
    const errField = json && 'error' in json ? json.error : undefined;
    const message = typeof errField === 'string' && errField ? errField : `Request failed (${res.status}).`;
    throw makeError(message, res.status);
  }
  return (json as SuccessEnvelope<T>).data;
}

/**
 * Some endpoints return extra top-level fields alongside `data` (e.g. bulk
 * import returns `{ success, created, failed, results }`). Use this when you
 * need the whole envelope rather than just `data`.
 */
async function requestRaw<R>(method: string, url: string, body?: unknown): Promise<R> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw makeError('Network error — please check your connection and try again.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    throw makeError((json && json.error) || `Request failed (${res.status}).`, res.status);
  }
  return json as R;
}

export const apiClient = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
  /** Raw-envelope variants for endpoints with extra top-level fields. */
  postRaw: <R>(url: string, body?: unknown) => requestRaw<R>('POST', url, body),
};
