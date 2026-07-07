/**
 * Turn a thrown error into human, non-technical copy for toasts and error
 * screens. Raw SDK/network/Cognito messages ("InvalidParameterException…",
 * "NetworkError when attempting to fetch resource") should never reach users —
 * log the original, show this. Known cases get specific, actionable guidance;
 * everything else falls back to a calm default.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again in a moment.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const name = err instanceof Error ? err.name : '';
  const hay = `${name} ${raw}`.toLowerCase();

  // Offline / network
  if (hay.includes('networkerror') || hay.includes('failed to fetch') || hay.includes('network request failed')) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  // Auth / session
  if (hay.includes('notauthorized') || hay.includes('incorrect username or password')) {
    return 'That email or password doesn’t match our records.';
  }
  if (hay.includes('usernameexists') || hay.includes('already exists')) {
    return 'An account with that email already exists.';
  }
  if (hay.includes('usernotfound')) {
    return 'We couldn’t find an account for that email.';
  }
  if (hay.includes('limitexceeded') || hay.includes('toomanyrequests') || hay.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (hay.includes('expired') && hay.includes('code')) {
    return 'That code has expired. Request a new one and try again.';
  }
  if (hay.includes('accessdenied') || hay.includes('not authorized to')) {
    return 'You don’t have permission to do that. Contact your administrator if you need access.';
  }
  if (hay.includes('invalidpassword') || hay.includes('password did not conform') || hay.includes('password must')) {
    return 'That password doesn’t meet the requirements. Use at least 8 characters with a mix of letters, numbers and symbols.';
  }
  // Server-side envelope messages we author are usually already friendly & short.
  if (raw && raw.length <= 120 && !/[{}]|exception|stack|http|aws|cognito|dynamodb|undefined is not/i.test(raw)) {
    return raw;
  }
  return fallback;
}
