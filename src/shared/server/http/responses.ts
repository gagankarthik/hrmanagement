import { NextResponse } from 'next/server';
import { NotFoundError, ValidationError } from '../errors';

/**
 * The single source of truth for the API response envelope.
 *
 * Every route handler returns `{ success: true, data }` on success or
 * `{ success: false, error }` on failure. Centralizing it here removes the
 * hand-rolled `NextResponse.json({ success, ... }, { status })` boilerplate that
 * was duplicated across every route, and guarantees the shape the browser
 * `apiClient` expects (see shared/lib/http/client.ts).
 */

export type ApiEnvelope<T> =
  | ({ success: true; data: T } & Record<string, unknown>)
  | { success: false; error: string };

/** 200 OK with a data payload (optionally merge extra top-level fields). */
export function ok<T>(data: T, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ success: true, data, ...extra });
}

/** 201 Created. */
export function created<T>(data: T, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ success: true, data, ...extra }, { status: 201 });
}

/** 400 Bad Request — caller error (validation, missing fields). */
export function badRequest(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

/** 404 Not Found. */
export function notFound(error = 'Not found'): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

/**
 * 500 Internal Server Error. Logs the underlying cause server-side and returns
 * a safe message. Accepts the original error so handlers can `catch (e) { return serverError(e) }`.
 */
export function serverError(error: unknown, fallback = 'Internal server error'): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  console.error('[api]', message, error);
  return NextResponse.json({ success: false, error: message || fallback }, { status: 500 });
}

/**
 * Map a thrown error to the right HTTP response. Domain errors become 4xx;
 * anything else is a 500. Lets every route use a single `catch (e) { return fail(e) }`.
 */
export function fail(error: unknown): NextResponse {
  if (error instanceof ValidationError) return badRequest(error.message);
  if (error instanceof NotFoundError) return notFound(error.message);
  return serverError(error);
}
