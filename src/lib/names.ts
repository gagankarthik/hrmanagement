// Helpers to ensure we never render raw IDs (e.g. UUIDs) in the UI.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): boolean {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

/**
 * Resolve a client/vendor/etc. reference to a human-readable name.
 * - If `id` matches a record in `lookup`, return its name.
 * - Else if a legacy free-text name is given (and isn't itself a UUID), use it.
 * - Else if `id` looks like a UUID with no match, return the `unknown` label
 *   (never the raw UUID).
 * - Else return `id` (a legacy text value stored where an id was expected).
 */
export function resolveName(
  id: string,
  lookup: { id: string; name?: string }[],
  opts?: { legacy?: string; unknown?: string }
): string {
  const found = lookup.find((x) => x.id === id)?.name;
  if (found) return found;
  if (opts?.legacy && !isUuid(opts.legacy)) return opts.legacy;
  if (isUuid(id)) return opts?.unknown ?? 'Unknown';
  return id;
}
