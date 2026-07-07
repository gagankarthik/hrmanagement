// New-hire onboarding packet — a per-employee checklist tracked to completion.

export const ONBOARDING_CATEGORIES = [
  'Paperwork & Tax',
  'Compliance',
  'IT & Equipment',
  'Orientation',
] as const;

export type OnboardingCategory = (typeof ONBOARDING_CATEGORIES)[number];

export interface OnboardingItem {
  key: string;
  label: string;
  category: OnboardingCategory;
  done: boolean;
  /** ISO timestamp of when it was checked off (for a light audit trail). */
  doneAt?: string;
}

export interface OnboardingPacket {
  employeeId: string;
  employeeName: string;
  employeeType?: string;
  /** Optional start/hire date for the packet header. */
  startDate?: string;
  items: OnboardingItem[];
  createdAt: string;
  updatedAt: string;
}

/** The standard checklist every new-hire packet starts from. */
export const ONBOARDING_TEMPLATE: { key: string; label: string; category: OnboardingCategory }[] = [
  // Paperwork & Tax
  { key: 'offer_signed', label: 'Signed offer letter', category: 'Paperwork & Tax' },
  { key: 'i9', label: 'I-9 employment eligibility verified', category: 'Paperwork & Tax' },
  { key: 'w4', label: 'W-4 federal withholding', category: 'Paperwork & Tax' },
  { key: 'state_tax', label: 'State tax withholding form', category: 'Paperwork & Tax' },
  { key: 'direct_deposit', label: 'Direct deposit / payment details', category: 'Paperwork & Tax' },
  { key: 'emergency_contact', label: 'Emergency contact collected', category: 'Paperwork & Tax' },
  // Compliance
  { key: 'work_auth', label: 'Work authorization document on file', category: 'Compliance' },
  { key: 'background_check', label: 'Background check cleared', category: 'Compliance' },
  { key: 'agreements', label: 'NDA / employment agreements signed', category: 'Compliance' },
  { key: 'handbook', label: 'Employee handbook acknowledged', category: 'Compliance' },
  // IT & Equipment
  { key: 'accounts', label: 'Email & system accounts created', category: 'IT & Equipment' },
  { key: 'equipment', label: 'Laptop / equipment issued', category: 'IT & Equipment' },
  { key: 'access', label: 'Building / system access granted', category: 'IT & Equipment' },
  // Orientation
  { key: 'orientation', label: 'Orientation scheduled', category: 'Orientation' },
  { key: 'benefits', label: 'Benefits enrollment completed', category: 'Orientation' },
  { key: 'team_intro', label: 'Team introduction / buddy assigned', category: 'Orientation' },
  { key: 'checkin_30', label: '30-day check-in scheduled', category: 'Orientation' },
];

/** Fresh checklist (all unchecked) from the template. */
export function buildDefaultItems(): OnboardingItem[] {
  return ONBOARDING_TEMPLATE.map((t) => ({ ...t, done: false }));
}

/**
 * Reconcile a saved packet's items against the current template: keep saved
 * done-state, add any newly-introduced template items, drop obsolete keys, and
 * return them in template order. Lets the checklist evolve without losing data.
 */
export function reconcileItems(saved: OnboardingItem[] | undefined): OnboardingItem[] {
  const byKey = new Map((saved ?? []).map((i) => [i.key, i]));
  return ONBOARDING_TEMPLATE.map((t) => {
    const prev = byKey.get(t.key);
    return { ...t, done: prev?.done ?? false, doneAt: prev?.doneAt };
  });
}

/** Completed count + percent for a packet's items. */
export function packetProgress(items: OnboardingItem[]): { done: number; total: number; pct: number } {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
