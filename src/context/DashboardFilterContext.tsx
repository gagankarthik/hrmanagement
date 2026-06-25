'use client';

/**
 * DashboardFilterContext — the single source of truth for the overview
 * dashboard's cross-widget filters (employment class · status · revenue ·
 * date range). Lifting these out of the page lets the KPI strip, charts,
 * sidebar panels and detail tables all read the same selection without
 * prop-drilling, and is the foundation for the view-switching / role-gated
 * layout described in the dashboard design.
 */

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { EmployeeType } from '@/types/employee';

export const DASH_CLASSES: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];

export type StatusFilter = 'all' | 'Active' | 'Terminated';
export type RevenueFilter = 'all' | 'B' | 'NB';

export type RangePreset =
  | 'all' | 'today' | '7d' | 'wtd' | 'mtd' | '30d' | '90d' | 'qtd' | 'ytd' | '12m' | 'custom';

export interface RangeOption { value: RangePreset; label: string }

export const RANGE_OPTIONS: RangeOption[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'wtd', label: 'This week' },
  { value: 'mtd', label: 'This month' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'qtd', label: 'This quarter' },
  { value: 'ytd', label: 'Year to date' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
];

/** Resolve a preset (or custom dates) to a concrete [start, end] window. */
export function resolveRange(
  preset: RangePreset, customStart?: string, customEnd?: string, ref: Date = new Date(),
): { start: Date | null; end: Date | null } {
  const day = 86400000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (preset) {
    case 'all': return { start: null, end: null };
    case 'today': return { start: startOfDay(ref), end: ref };
    case '7d': return { start: new Date(ref.getTime() - 7 * day), end: ref };
    case 'wtd': { const d = startOfDay(ref); d.setDate(d.getDate() - d.getDay()); return { start: d, end: ref }; }
    case 'mtd': return { start: new Date(ref.getFullYear(), ref.getMonth(), 1), end: ref };
    case '30d': return { start: new Date(ref.getTime() - 30 * day), end: ref };
    case '90d': return { start: new Date(ref.getTime() - 90 * day), end: ref };
    case 'qtd': return { start: new Date(ref.getFullYear(), Math.floor(ref.getMonth() / 3) * 3, 1), end: ref };
    case 'ytd': return { start: new Date(ref.getFullYear(), 0, 1), end: ref };
    case '12m': return { start: new Date(ref.getFullYear() - 1, ref.getMonth(), ref.getDate()), end: ref };
    case 'custom': return {
      start: customStart ? new Date(customStart) : null,
      end: customEnd ? new Date(customEnd) : null,
    };
  }
}

interface DashboardFilterValue {
  classFilter: Set<EmployeeType>;
  statusFilter: StatusFilter;
  revenueFilter: RevenueFilter;
  range: RangePreset;
  customStart: string;
  customEnd: string;

  rangeStart: Date | null;
  rangeEnd: Date | null;
  rangeLabel: string;

  toggleClass: (c: EmployeeType) => void;
  setStatusFilter: (s: StatusFilter) => void;
  setRevenueFilter: (r: RevenueFilter) => void;
  setRange: (r: RangePreset) => void;
  setCustomRange: (start: string, end: string) => void;
  resetFilters: () => void;

  filtersOn: boolean;
}

const Ctx = createContext<DashboardFilterValue | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const [classFilter, setClassFilter] = useState<Set<EmployeeType>>(new Set(DASH_CLASSES));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>('all');
  const [range, setRange] = useState<RangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { rangeStart, rangeEnd } = useMemo(() => {
    const { start, end } = resolveRange(range, customStart, customEnd);
    return { rangeStart: start, rangeEnd: end };
  }, [range, customStart, customEnd]);

  const rangeLabel = useMemo(() => {
    if (range === 'custom' && customStart) {
      const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return customEnd ? `${fmt(customStart)} – ${fmt(customEnd)}` : `From ${fmt(customStart)}`;
    }
    return RANGE_OPTIONS.find((o) => o.value === range)?.label ?? 'All time';
  }, [range, customStart, customEnd]);

  const toggleClass = useCallback((c: EmployeeType) => {
    setClassFilter((prev) => {
      const n = new Set(prev);
      if (n.has(c)) { if (n.size > 1) n.delete(c); } else n.add(c);
      return n;
    });
  }, []);

  const setCustomRange = useCallback((start: string, end: string) => {
    setCustomStart(start); setCustomEnd(end); setRange('custom');
  }, []);

  const resetFilters = useCallback(() => {
    setClassFilter(new Set(DASH_CLASSES));
    setStatusFilter('all'); setRevenueFilter('all'); setRange('all');
    setCustomStart(''); setCustomEnd('');
  }, []);

  const filtersOn = classFilter.size < DASH_CLASSES.length || statusFilter !== 'all' || revenueFilter !== 'all' || range !== 'all';

  const value: DashboardFilterValue = {
    classFilter, statusFilter, revenueFilter, range, customStart, customEnd,
    rangeStart, rangeEnd, rangeLabel,
    toggleClass, setStatusFilter, setRevenueFilter, setRange, setCustomRange, resetFilters,
    filtersOn,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardFilters() {
  const ctx = useContext(Ctx);
  if (ctx === undefined) throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  return ctx;
}
