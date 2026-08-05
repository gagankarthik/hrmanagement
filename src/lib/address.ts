/**
 * Partner addresses are stored as parts (street, city, state, ZIP, country) so
 * they can be read, exported and searched field by field. `address` holds the
 * street line; records created before the split still carry their whole address
 * there, and every helper here degrades to that safely.
 */

export interface AddressParts {
  /** Street line, e.g. "500 Market St, Suite 400". */
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

const clean = (v?: string) => (v ?? '').trim();

/** "500 Market St, San Francisco, CA 94105, USA" — blank parts drop out. */
export function formatAddress(a: AddressParts | null | undefined): string {
  if (!a) return '';
  const region = [clean(a.state), clean(a.zip)].filter(Boolean).join(' ');
  return [clean(a.address), clean(a.city), region, clean(a.country)].filter(Boolean).join(', ');
}

/** Street on one line, "City, ST 94105" on the next, country last. */
export function addressLines(a: AddressParts | null | undefined): string[] {
  if (!a) return [];
  const region = [clean(a.city), [clean(a.state), clean(a.zip)].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [clean(a.address), region, clean(a.country)].filter(Boolean);
}

/** Lowercased haystack for list search — every part in one string. */
export function addressSearchText(a: AddressParts | null | undefined): string {
  if (!a) return '';
  return [a.address, a.city, a.state, a.zip, a.country]
    .map((v) => clean(v))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function hasAddress(a: AddressParts | null | undefined): boolean {
  return formatAddress(a).length > 0;
}
