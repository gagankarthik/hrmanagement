'use client';

import React, { useMemo, useState } from 'react';
import {
  PieChart, AlertOctagon, AlertTriangle, UserMinus, Sparkles,
  Users, DollarSign, Gauge, Calendar, TrendingUp,
  Shield, MapPin, Building2, Package, Cake, Award,
  Heart, Wallet, ShieldCheck, Briefcase, Globe, FileCheck,
  CheckCircle2, XCircle, FileText, ChevronRight,
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { Employee, EmployeeType } from '@/types/employee';
import { cn } from '@/lib/utils';
import { resolveName } from '@/lib/names';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PeopleListModal } from '@/components/dashboard/PeopleListModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  DonutChart, CompareBarChart, TrendAreaChart,
  VIZ, TYPE_COLOR as VIZ_TYPE_COLOR,
} from '@/components/dashboard/Charts';

const HOURS_PER_MONTH = 173;

const TYPE_COLOR: Record<EmployeeType, { hex: string; bg: string; ring: string; text: string }> = {
  W2:       { hex: '#3b82f6', bg: 'bg-blue-500',   ring: 'ring-blue-200',   text: 'text-blue-700' },
  Contract: { hex: '#a855f7', bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700' },
  '1099':   { hex: '#14b8a6', bg: 'bg-teal-500',   ring: 'ring-teal-200',   text: 'text-teal-700' },
  Offshore: { hex: '#ec4899', bg: 'bg-pink-500',   ring: 'ring-pink-200',   text: 'text-pink-700' },
};
const TYPE_LABEL: Record<EmployeeType, string> = {
  W2: 'W-2', Contract: 'Contract', '1099': '1099', Offshore: 'Offshore',
};
const TYPE_DRILL_TONE: Record<EmployeeType, 'sky' | 'purple' | 'emerald' | 'pink'> = {
  W2: 'sky', Contract: 'purple', '1099': 'emerald', Offshore: 'pink',
};

const STATUS_COLOR = { Active: '#10b981', Terminated: '#ef4444' };
const REVENUE_COLOR = { Billable: '#10b981', NonBillable: '#f59e0b' };

function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}
function compactCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function monthlyPay(e: Employee): number {
  const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
  const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
  const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
  if (typeof pay === 'number' && pay > 0) {
    return salaryType === 'Hourly' ? pay * HOURS_PER_MONTH : pay / 12;
  }
  if (typeof salary === 'number' && salary > 0) return salary;
  return 0;
}

type DrillTone = 'red' | 'amber' | 'yellow' | 'emerald' | 'sky' | 'pink' | 'purple' | 'brand' | 'slate';

interface DrillConfig {
  title: string;
  description?: string;
  icon: React.ElementType;
  tone: DrillTone;
  people: Employee[];
  contextGetter?: (e: Employee) => { primary?: string; secondary?: string };
}

export default function AnalyticsPage() {
  const { employees, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();

  // Single drill-down modal for click-through across the whole page.
  const [drill, setDrill] = useState<DrillConfig | null>(null);

  // All charts compute against the full workforce — clicks drill into details rather than cross-filter.
  const filtered = employees;

  // ───────────────────────── METRICS ─────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in60 = new Date(now.getTime() + 60 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);
    const last7 = new Date(now.getTime() - 7 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    const active = filtered.filter(isActive);
    let revenue = 0, totalPay = 0, billable = 0;
    let expired = 0, in30Bucket = 0, in60Bucket = 0, in90Bucket = 0, beyond90 = 0;
    let bench = 0, newThisWeek = 0, newThisMonth = 0;
    let withMedical = 0, with401k = 0, w2Count = 0;
    let withMissingEmail = 0, withMissingPhone = 0, withMissingAddress = 0;
    let totalAgeYears = 0, ageCount = 0, totalTenureDays = 0, tenureCount = 0;
    let totalOnboardDays = 0, onboardCount = 0;
    let subActive = 0, subInactive = 0;

    const tenureBuckets = { '<1y': 0, '1–3y': 0, '3–5y': 0, '5–10y': 0, '10y+': 0 };
    const ageBuckets = { '<25': 0, '25–34': 0, '35–44': 0, '45–54': 0, '55+': 0 };
    const stateDist: Record<string, number> = {};
    const cityDist: Record<string, number> = {};
    const authDist: Record<string, number> = {};
    const offshorePayrollDist: Record<string, number> = {};
    const offshoreEmpDist: Record<string, number> = {};
    let offshoreWithAadhar = 0, offshoreWithPan = 0, offshoreWithPf = 0, offshoreTotal = 0;

    filtered.forEach((e) => {
      const isW2 = e.type === 'W2';
      if (isW2) w2Count += 1;

      // Data quality
      if (!e.personalEmail && !('officeEmail' in e && (e as { officeEmail?: string }).officeEmail)) withMissingEmail += 1;
      if (!e.contactNo) withMissingPhone += 1;
      if (!e.address || !e.city || !e.state) withMissingAddress += 1;

      // Sub status
      const sub = 'subcontractorStatus' in e ? (e as { subcontractorStatus?: string }).subcontractorStatus : undefined;
      if (sub === 'Active') subActive += 1;
      else if (sub === 'Inactive') subInactive += 1;

      // Age + Tenure
      if (e.dob) {
        const d = new Date(e.dob);
        if (!Number.isNaN(d.getTime())) {
          const age = differenceInYears(now, d);
          totalAgeYears += age; ageCount += 1;
          if (age < 25) ageBuckets['<25'] += 1;
          else if (age < 35) ageBuckets['25–34'] += 1;
          else if (age < 45) ageBuckets['35–44'] += 1;
          else if (age < 55) ageBuckets['45–54'] += 1;
          else ageBuckets['55+'] += 1;
        }
      }
      if (e.hireDate) {
        const h = new Date(e.hireDate);
        if (!Number.isNaN(h.getTime())) {
          const days = differenceInDays(now, h);
          if (days >= 0) {
            totalTenureDays += days; tenureCount += 1;
            const years = days / 365;
            if (years < 1) tenureBuckets['<1y'] += 1;
            else if (years < 3) tenureBuckets['1–3y'] += 1;
            else if (years < 5) tenureBuckets['3–5y'] += 1;
            else if (years < 10) tenureBuckets['5–10y'] += 1;
            else tenureBuckets['10y+'] += 1;
          }
          if (h >= last7 && h <= now) newThisWeek += 1;
          if (h >= last30 && h <= now) newThisMonth += 1;
        }
      }

      // Time-to-onboard
      if (e.hireDate && e.createdAt) {
        const c = new Date(e.createdAt), h = new Date(e.hireDate);
        if (!Number.isNaN(c.getTime()) && !Number.isNaN(h.getTime())) {
          const d = differenceInDays(h, c);
          if (d >= 0 && d <= 180) { totalOnboardDays += d; onboardCount += 1; }
        }
      }

      // Geography
      if (e.state) stateDist[e.state] = (stateDist[e.state] || 0) + 1;
      if (e.city) cityDist[e.city] = (cityDist[e.city] || 0) + 1;

      // Work auth distribution
      const wa = 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined;
      if (wa) authDist[wa] = (authDist[wa] || 0) + 1;

      // Offshore-specific
      if (e.type === 'Offshore') {
        offshoreTotal += 1;
        const pe = 'payrollEntity' in e ? (e as { payrollEntity?: string }).payrollEntity : undefined;
        const et = 'employmentType' in e ? (e as { employmentType?: string }).employmentType : undefined;
        if (pe) offshorePayrollDist[pe] = (offshorePayrollDist[pe] || 0) + 1;
        if (et) offshoreEmpDist[et] = (offshoreEmpDist[et] || 0) + 1;
        if ('aadharNumber' in e && (e as { aadharNumber?: string }).aadharNumber) offshoreWithAadhar += 1;
        if ('panNumber' in e && (e as { panNumber?: string }).panNumber) offshoreWithPan += 1;
        if ('pfNumber' in e && (e as { pfNumber?: string }).pfNumber) offshoreWithPf += 1;
      }
    });

    active.forEach((e) => {
      const billableFlag = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      const pay = monthlyPay(e);
      totalPay += pay;
      if (billableFlag) { billable += 1; revenue += pay; }

      const expiry = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (expiry) {
        const d = new Date(expiry);
        if (!Number.isNaN(d.getTime())) {
          if (d < now) expired += 1;
          else if (d <= in30) in30Bucket += 1;
          else if (d <= in60) in60Bucket += 1;
          else if (d <= in90) in90Bucket += 1;
          else beyond90 += 1;
        }
      }

      const hasClient =
        e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
        Boolean(e.clientId || e.client);
      if (!hasClient || !billableFlag) bench += 1;

      // W2 benefits
      if (e.type === 'W2') {
        if ('medicalBenefit' in e && (e as { medicalBenefit?: boolean }).medicalBenefit) withMedical += 1;
        if ('benefit401k' in e && (e as { benefit401k?: boolean }).benefit401k) with401k += 1;
      }
    });

    return {
      total: filtered.length,
      active: active.length,
      terminated: filtered.length - active.length,
      revenue, totalPay, billable,
      utilization: active.length ? Math.round((billable / active.length) * 100) : 0,
      bench, expired, in30Bucket, in60Bucket, in90Bucket, beyond90,
      newThisWeek, newThisMonth,
      avgAge: ageCount ? Math.round(totalAgeYears / ageCount) : null,
      avgTenureYears: tenureCount ? +(totalTenureDays / tenureCount / 365).toFixed(1) : null,
      avgOnboardDays: onboardCount ? Math.round(totalOnboardDays / onboardCount) : null,
      tenureBuckets, ageBuckets, stateDist, cityDist, authDist,
      withMedical, with401k, w2Count,
      withMissingEmail, withMissingPhone, withMissingAddress,
      offshorePayrollDist, offshoreEmpDist,
      offshoreWithAadhar, offshoreWithPan, offshoreWithPf, offshoreTotal,
      subActive, subInactive,
    };
  }, [filtered]);

  // Type / status / revenue distributions
  const typeDist = useMemo(() => {
    const m: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
    filtered.forEach((e) => m[e.type] += 1);
    return (Object.entries(m) as [EmployeeType, number][]).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const statusDist = useMemo(() => {
    return [
      { label: 'Active', value: metrics.active, color: STATUS_COLOR.Active },
      { label: 'Terminated', value: metrics.terminated, color: STATUS_COLOR.Terminated },
    ];
  }, [metrics]);

  const revenueDist = useMemo(() => {
    let billable = 0, nonBillable = 0;
    filtered.forEach((e) => {
      if ('revenueStatus' in e) {
        if ((e as { revenueStatus?: string }).revenueStatus === 'B') billable += 1;
        else if ((e as { revenueStatus?: string }).revenueStatus === 'NB') nonBillable += 1;
      }
    });
    return [
      { label: 'Billable', value: billable, color: REVENUE_COLOR.Billable },
      { label: 'Non-Billable', value: nonBillable, color: REVENUE_COLOR.NonBillable },
    ];
  }, [filtered]);

  // Type × Status stacked
  const typeByStatus = useMemo(() => {
    const types: EmployeeType[] = ['W2', 'Contract', '1099', 'Offshore'];
    return types.map((t) => {
      const subset = filtered.filter((e) => e.type === t);
      const a = subset.filter(isActive).length;
      const x = subset.length - a;
      return { label: t, active: a, terminated: x, total: subset.length };
    });
  }, [filtered]);

  // ── recharts-shaped views of the computed distributions (render-only mapping) ──
  const typePie = useMemo(
    () => typeDist
      .filter((d) => d.value > 0)
      .map((d) => ({ name: TYPE_LABEL[d.label], value: d.value, color: VIZ_TYPE_COLOR[d.label] ?? VIZ.slate })),
    [typeDist],
  );
  const statusPie = useMemo(
    () => statusDist
      .filter((d) => d.value > 0)
      .map((d) => ({ name: d.label, value: d.value, color: d.label === 'Active' ? VIZ.emerald : VIZ.rose })),
    [statusDist],
  );
  const revenuePie = useMemo(
    () => revenueDist
      .filter((d) => d.value > 0)
      .map((d) => ({ name: d.label, value: d.value, color: d.label === 'Billable' ? VIZ.emerald : VIZ.amber })),
    [revenueDist],
  );
  // Comparison "vs" bars: active vs terminated headcount per employee class
  const typeByStatusBars = useMemo(
    () => typeByStatus.map((d) => ({ type: TYPE_LABEL[d.label], Active: d.active, Terminated: d.terminated })),
    [typeByStatus],
  );

  // Monthly hires (12 months)
  const monthlyHires = useMemo(() => {
    const months = 12;
    const now = new Date();
    const arr: { label: string; value: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ label: format(d, 'MMM'), value: 0 });
    }
    filtered.forEach((e) => {
      if (!e.hireDate) return;
      const h = new Date(e.hireDate);
      if (Number.isNaN(h.getTime())) return;
      for (let i = 0; i < months; i++) {
        const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
        const end = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 1);
        if (h >= start && h < end) { arr[i].value += 1; break; }
      }
    });
    return arr;
  }, [filtered]);

  // Monthly hires split by class (12 months) — powers the W-2 vs Offshore vs Total trend area
  const monthlyHiresByType = useMemo(() => {
    const months = 12;
    const now = new Date();
    const rows: { month: string; total: number; W2: number; Offshore: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      rows.push({ month: format(d, 'MMM'), total: 0, W2: 0, Offshore: 0 });
    }
    filtered.forEach((e) => {
      if (!e.hireDate) return;
      const h = new Date(e.hireDate);
      if (Number.isNaN(h.getTime())) return;
      for (let i = 0; i < months; i++) {
        const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
        const end = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 1);
        if (h >= start && h < end) {
          rows[i].total += 1;
          if (e.type === 'W2') rows[i].W2 += 1;
          else if (e.type === 'Offshore') rows[i].Offshore += 1;
          break;
        }
      }
    });
    return rows;
  }, [filtered]);

  // Top clients/vendors and end variants
  const computeTop = (
    pickIds: (e: Employee) => string[],
    lookup: { id: string; name: string }[],
    unknownLabel = 'Unknown',
  ) => {
    const dist: Record<string, { id: string; name: string; count: number }> = {};
    filtered.forEach((e) => {
      // Dedupe per employee so one person isn't counted twice for the same record
      Array.from(new Set(pickIds(e))).forEach((id) => {
        const known = lookup.some((x) => x.id === id);
        const name = resolveName(id, lookup, { unknown: unknownLabel });
        const key = known ? id : `name:${name.toLowerCase()}`;
        if (!dist[key]) dist[key] = { id: known ? id : '', name, count: 0 };
        dist[key].count += 1;
      });
    });
    return Object.values(dist).sort((a, b) => b.count - a.count).slice(0, 10);
  };
  const topClients = useMemo(() => computeTop(
    (e) => e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []),
    clients, 'Unknown client'
  ), [filtered, clients]);
  const topVendors = useMemo(() => computeTop(
    (e) => e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []),
    vendors, 'Unknown vendor'
  ), [filtered, vendors]);
  const topEndClients = useMemo(() => computeTop(
    (e) => e.endClientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.endClientId ? [e.endClientId] : []),
    clients, 'Unknown end client'
  ), [filtered, clients]);
  const topEndVendors = useMemo(() => computeTop(
    (e) => e.endVendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.endVendorId ? [e.endVendorId] : []),
    vendors, 'Unknown end vendor'
  ), [filtered, vendors]);

  const topStates = useMemo(() => Object.entries(metrics.stateDist)
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
    [metrics.stateDist]);

  const topCities = useMemo(() => Object.entries(metrics.cityDist)
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
    [metrics.cityDist]);

  const topAuths = useMemo(() => Object.entries(metrics.authDist)
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
    [metrics.authDist]);

  // Upcoming birthdays / anniversaries
  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return filtered.filter((e) => {
      if (!e.dob) return false;
      const d = new Date(e.dob);
      if (Number.isNaN(d.getTime())) return false;
      const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
      return thisYear <= in30;
    }).sort((a, b) => {
      const da = new Date(a.dob!), db = new Date(b.dob!);
      const ya = new Date(new Date().getFullYear(), da.getMonth(), da.getDate());
      const yb = new Date(new Date().getFullYear(), db.getMonth(), db.getDate());
      return ya.getTime() - yb.getTime();
    }).slice(0, 5);
  }, [filtered]);

  const upcomingAnniversaries = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return filtered.filter((e) => {
      if (!e.hireDate) return false;
      const d = new Date(e.hireDate);
      if (Number.isNaN(d.getTime())) return false;
      const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
      const years = now.getFullYear() - d.getFullYear();
      if (years < 1) return false;
      return thisYear <= in30;
    }).slice(0, 5);
  }, [filtered]);

  // ─────────── Drill-down helpers (open modal with employees) ───────────
  const ctxHire = (e: Employee) => {
    if (!e.hireDate) return {};
    const d = new Date(e.hireDate);
    if (Number.isNaN(d.getTime())) return {};
    return {
      primary: format(d, 'MMM d, yyyy'),
      secondary: `${differenceInDays(new Date(), d)}d ago`,
    };
  };
  const ctxExpiry = (e: Employee) => {
    const raw = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!raw) return {};
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return {};
    const now = new Date();
    const days = differenceInDays(d, now);
    return {
      primary: format(d, 'MMM d, yyyy'),
      secondary: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`,
    };
  };
  const ctxBirthday = (e: Employee) => {
    if (!e.dob) return {};
    const now = new Date();
    const d = new Date(e.dob);
    if (Number.isNaN(d.getTime())) return {};
    const ty = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (ty < now) ty.setFullYear(now.getFullYear() + 1);
    return { primary: format(ty, 'MMM d'), secondary: `Turning ${ty.getFullYear() - d.getFullYear()}` };
  };
  const ctxAnniversary = (e: Employee) => {
    if (!e.hireDate) return {};
    const now = new Date();
    const d = new Date(e.hireDate);
    if (Number.isNaN(d.getTime())) return {};
    const ty = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (ty < now) ty.setFullYear(now.getFullYear() + 1);
    return { primary: format(ty, 'MMM d'), secondary: `${ty.getFullYear() - d.getFullYear()} years` };
  };
  const ctxLocation = (e: Employee) => ({
    primary: e.state || '—',
    secondary: e.city || undefined,
  });
  const ctxPay = (e: Employee) => {
    const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
    const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
    const v = monthlyPay(e);
    if (v <= 0 && !pay && !salary) return { primary: '—' };
    return { primary: compactCurrency(v) + '/mo', secondary: e.position || undefined };
  };
  const isActiveE = (e: Employee) => 'status' in e ? (e as { status: string }).status === 'Active' : true;

  const openType = (t: EmployeeType) => setDrill({
    title: `${TYPE_LABEL[t]} employees`,
    description: `Showing ${filtered.filter((e) => e.type === t).length} employees in the ${t} class.`,
    icon: Users, tone: TYPE_DRILL_TONE[t],
    people: filtered.filter((e) => e.type === t),
    contextGetter: ctxHire,
  });
  const openStatus = (s: 'Active' | 'Terminated') => setDrill({
    title: `${s} employees`,
    description: s === 'Active' ? 'All active employees on the books.' : 'All terminated employees.',
    icon: s === 'Active' ? CheckCircle2 : XCircle,
    tone: s === 'Active' ? 'emerald' : 'red',
    people: filtered.filter((e) => 'status' in e && (e as { status: string }).status === s),
    contextGetter: ctxHire,
  });
  const openRevenue = (r: 'Billable' | 'Non-Billable') => setDrill({
    title: `${r} workforce`,
    description: r === 'Billable' ? 'Active employees generating billable revenue.' : 'Active employees not currently billable.',
    icon: DollarSign,
    tone: r === 'Billable' ? 'emerald' : 'amber',
    people: filtered.filter((e) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === (r === 'Billable' ? 'B' : 'NB')),
    contextGetter: ctxPay,
  });
  const openExpired = () => {
    const now = new Date();
    const people = filtered.filter((e) => {
      if (!isActiveE(e)) return false;
      const raw = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!raw) return false;
      const d = new Date(raw);
      return !Number.isNaN(d.getTime()) && d < now;
    });
    setDrill({ title: 'Authorizations Expired', description: 'Active employees whose work authorization is past due — renew immediately.', icon: AlertOctagon, tone: 'red', people, contextGetter: ctxExpiry });
  };
  const openExpiryBucket = (label: 'in30' | 'in60' | 'in90' | 'beyond') => {
    const now = new Date();
    const ranges: Record<typeof label, [number, number]> = {
      in30: [0, 30], in60: [30, 60], in90: [60, 90], beyond: [90, Infinity],
    };
    const [from, to] = ranges[label];
    const people = filtered.filter((e) => {
      if (!isActiveE(e)) return false;
      const raw = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime()) || d < now) return false;
      const days = differenceInDays(d, now);
      return days >= from && days < (to === Infinity ? 36500 : to);
    });
    const labels: Record<typeof label, { title: string; tone: DrillTone }> = {
      in30: { title: 'Expiring in 0–30 days', tone: 'amber' },
      in60: { title: 'Expiring in 31–60 days', tone: 'yellow' },
      in90: { title: 'Expiring in 61–90 days', tone: 'sky' },
      beyond: { title: 'Expiring 90+ days out', tone: 'slate' },
    };
    setDrill({ title: labels[label].title, description: 'Work authorizations in this expiry window.', icon: AlertTriangle, tone: labels[label].tone, people, contextGetter: ctxExpiry });
  };
  const openBench = () => {
    const now = new Date();
    const people = filtered.filter((e) => {
      if (!isActiveE(e)) return false;
      const hasClient =
        e.clientAssignments?.some((a) => a.clientId && (!a.endDate || new Date(a.endDate) >= now)) ||
        Boolean(e.clientId || e.client);
      const billable = 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B';
      return !hasClient || !billable;
    });
    setDrill({ title: 'On Bench', description: 'Active employees without a client or marked non-billable.', icon: UserMinus, tone: 'yellow', people, contextGetter: (e) => ({ primary: e.position || '—', secondary: e.state || undefined }) });
  };
  const openNewThisWeek = () => {
    const now = new Date(), last7 = new Date(now.getTime() - 7 * 86400000);
    const people = filtered.filter((e) => {
      if (!e.hireDate) return false;
      const d = new Date(e.hireDate);
      return !Number.isNaN(d.getTime()) && d >= last7 && d <= now;
    });
    setDrill({ title: 'New This Week', description: 'New hires onboarded in the last 7 days.', icon: Sparkles, tone: 'emerald', people, contextGetter: ctxHire });
  };
  const openState = (state: string) => {
    setDrill({ title: `Employees in ${state}`, description: `All employees based in ${state}.`, icon: MapPin, tone: 'sky', people: filtered.filter((e) => e.state === state), contextGetter: ctxLocation });
  };
  const openCity = (city: string) => {
    setDrill({ title: `Employees in ${city}`, description: `All employees based in ${city}.`, icon: MapPin, tone: 'brand', people: filtered.filter((e) => e.city === city), contextGetter: ctxLocation });
  };
  const openClient = (id: string) => {
    const name = resolveName(id, clients, { unknown: 'Unknown client' });
    const people = filtered.filter((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []);
      return ids.includes(id);
    });
    setDrill({ title: `${name} placements`, description: `Employees currently assigned to ${name}.`, icon: Building2, tone: 'emerald', people, contextGetter: ctxHire });
  };
  const openVendor = (id: string) => {
    const name = resolveName(id, vendors, { unknown: 'Unknown vendor' });
    const people = filtered.filter((e) => {
      const ids = e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []);
      return ids.includes(id);
    });
    setDrill({ title: `${name} placements`, description: `Employees contracted via ${name}.`, icon: Package, tone: 'purple', people, contextGetter: ctxHire });
  };
  const openAuthType = (auth: string) => {
    const people = filtered.filter((e) => 'workAuthorization' in e && (e as { workAuthorization?: string }).workAuthorization === auth);
    setDrill({ title: `${auth} holders`, description: `Employees with ${auth} work authorization.`, icon: Shield, tone: 'brand', people, contextGetter: ctxExpiry });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[0,1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const dataCompletenessEmail = filtered.length ? Math.round((1 - metrics.withMissingEmail / filtered.length) * 100) : 100;
  const dataCompletenessPhone = filtered.length ? Math.round((1 - metrics.withMissingPhone / filtered.length) * 100) : 100;
  const dataCompletenessAddress = filtered.length ? Math.round((1 - metrics.withMissingAddress / filtered.length) * 100) : 100;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* HEADER */}
      <PageHeader
        icon={PieChart}
        eyebrow="Insights"
        title="HR Analytics"
        tone="brand"
        description={`Every workforce metric, derived live from ${employees.length.toLocaleString()} employee record${employees.length === 1 ? '' : 's'}. Click any chart segment to see the people behind the number.`}
      />

      {/* CRITICAL ALERTS — TOP, biggest cards */}
      <section>
        <SectionHeader title="Critical Attention" subtitle="Click any card to see exactly who's in that category." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AlertCard
            tone="red"
            icon={AlertOctagon}
            label="Authorizations Expired"
            value={metrics.expired}
            sub={metrics.expired === 0 ? 'Nothing past due' : 'Renew immediately'}
            onClick={metrics.expired > 0 ? openExpired : undefined}
          />
          <AlertCard
            tone="amber"
            icon={AlertTriangle}
            label="Expire in 30 Days"
            value={metrics.in30Bucket}
            sub={`${metrics.in60Bucket + metrics.in90Bucket} more in 31–90d`}
            onClick={metrics.in30Bucket > 0 ? () => openExpiryBucket('in30') : undefined}
          />
          <AlertCard
            tone="yellow"
            icon={UserMinus}
            label="On Bench"
            value={metrics.bench}
            sub={metrics.active ? `${Math.round((metrics.bench / metrics.active) * 100)}% of active workforce` : 'No active staff'}
            onClick={metrics.bench > 0 ? openBench : undefined}
          />
          <AlertCard
            tone="emerald"
            icon={Sparkles}
            label="New This Week"
            value={metrics.newThisWeek}
            sub={`${metrics.newThisMonth} new in last 30 days`}
            onClick={metrics.newThisWeek > 0 ? openNewThisWeek : undefined}
          />
        </div>
      </section>

      {/* EXECUTIVE KPI STRIP */}
      <section>
        <SectionHeader title="Executive Summary" subtitle="At-a-glance KPIs across your workforce." />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <KpiTile icon={Users}      label="Headcount"    value={metrics.total.toLocaleString()}       sub={`${metrics.active} active`} tone="brand" />
          <KpiTile icon={DollarSign} label="Run-Rate"     value={compactCurrency(metrics.revenue)}     sub="Monthly billable" tone="emerald" />
          <KpiTile icon={Gauge}      label="Utilization"  value={`${metrics.utilization}%`}            sub={`${metrics.billable} billable`} tone="brand" />
          <KpiTile icon={Award}      label="Avg Tenure"   value={metrics.avgTenureYears !== null ? `${metrics.avgTenureYears}y` : '—'} sub="years of service" tone="purple" />
          <KpiTile icon={Cake}       label="Avg Age"      value={metrics.avgAge !== null ? `${metrics.avgAge}` : '—'} sub="years" tone="pink" />
          <KpiTile icon={Calendar}   label="Time-to-Onboard" value={metrics.avgOnboardDays !== null ? `${metrics.avgOnboardDays}d` : '—'} sub="avg days" tone="sky" />
        </div>
      </section>

      {/* WORKFORCE COMPOSITION */}
      <section>
        <SectionHeader title="Workforce Composition" subtitle="Who makes up your workforce — class, status, revenue." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* Type donut */}
          <ChartCard title="By Class" hint="Click a class chip to see who" className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-3" style={{ animationDelay: '40ms' }}>
            {typePie.length === 0 ? (
              <EmptyChart label="No data" />
            ) : (
              <>
                <DonutChart data={typePie} height={200} />
                <DrillChips
                  items={typeDist
                    .filter((d) => d.value > 0)
                    .map((d) => ({ key: d.label, label: TYPE_LABEL[d.label], value: d.value, color: VIZ_TYPE_COLOR[d.label] ?? VIZ.slate }))}
                  onSelect={(key) => openType(key as EmployeeType)}
                />
              </>
            )}
          </ChartCard>

          {/* Status donut */}
          <ChartCard title="By Status" hint="Click a status chip to see who" className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-3" style={{ animationDelay: '120ms' }}>
            {statusPie.length === 0 ? (
              <EmptyChart label="No status data" />
            ) : (
              <>
                <DonutChart data={statusPie} height={200} />
                <DrillChips
                  items={statusDist
                    .filter((d) => d.value > 0)
                    .map((d) => ({ key: d.label, label: d.label, value: d.value, color: d.label === 'Active' ? VIZ.emerald : VIZ.rose }))}
                  onSelect={(key) => openStatus(key as 'Active' | 'Terminated')}
                />
              </>
            )}
          </ChartCard>

          {/* Revenue donut */}
          <ChartCard title="Billable vs Non-Billable" hint="Click a chip to see who" className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-3" style={{ animationDelay: '200ms' }}>
            {revenuePie.length === 0 ? (
              <EmptyChart label="No revenue data" />
            ) : (
              <>
                <DonutChart data={revenuePie} height={200} />
                <DrillChips
                  items={revenueDist
                    .filter((d) => d.value > 0)
                    .map((d) => ({ key: d.label, label: d.label, value: d.value, color: d.label === 'Billable' ? VIZ.emerald : VIZ.amber }))}
                  onSelect={(key) => openRevenue(key as 'Billable' | 'Non-Billable')}
                />
              </>
            )}
          </ChartCard>

          {/* Type × Status comparison bars (active vs terminated) */}
          <ChartCard title="Class × Status" hint="Active vs terminated by employee class" className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-3" style={{ animationDelay: '280ms' }}>
            {typeByStatus.every((d) => d.total === 0) ? (
              <EmptyChart label="No data" />
            ) : (
              <CompareBarChart
                data={typeByStatusBars}
                xKey="type"
                height={236}
                bars={[
                  { key: 'Active', name: 'Active', color: VIZ.emerald },
                  { key: 'Terminated', name: 'Terminated', color: VIZ.rose },
                ]}
              />
            )}
          </ChartCard>
        </div>
      </section>

      {/* COMPLIANCE & RISK */}
      <section>
        <SectionHeader title="Compliance & Risk" subtitle="Work authorization, subcontractor status, data quality." />
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Auth expiry buckets */}
          <ChartCard title="Authorization Expiry Buckets" hint="Click a bar to see who" className="lg:col-span-5">
            <ExpiryBuckets
              expired={metrics.expired}
              in30={metrics.in30Bucket}
              in60={metrics.in60Bucket}
              in90={metrics.in90Bucket}
              beyond={metrics.beyond90}
              onSelect={(b) => {
                if (b === 'expired') openExpired();
                else openExpiryBucket(b);
              }}
            />
          </ChartCard>

          {/* Auth type horizontal bar */}
          <ChartCard title="Work Authorization Mix" hint="Click a row to see who" className="lg:col-span-4">
            {topAuths.length === 0 ? (
              <EmptyChart label="No authorization data" />
            ) : (
              <HBarList items={topAuths} accent="bg-brand-500" onSelect={(label) => openAuthType(label)} />
            )}
          </ChartCard>

          {/* Subcontractor + data quality */}
          <ChartCard title="Compliance Health" hint="Subcontractor + data quality scores" className="lg:col-span-3">
            <div className="space-y-4">
              <MiniStat
                icon={ShieldCheck}
                label="Active Subcontractors"
                value={metrics.subActive}
                sub={`${metrics.subInactive} inactive`}
                tone="emerald"
              />
              <RingScore label="Email completeness"   pct={dataCompletenessEmail}   tone="brand" />
              <RingScore label="Phone completeness"   pct={dataCompletenessPhone}   tone="purple" />
              <RingScore label="Address completeness" pct={dataCompletenessAddress} tone="sky" />
            </div>
          </ChartCard>
        </div>
      </section>

      {/* FINANCIAL */}
      <section>
        <SectionHeader title="Financial Snapshot" subtitle="Monthly run-rate, benefits adoption, cost distribution." />
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Run-rate by type */}
          <ChartCard title="Monthly Run-Rate by Class" hint="Sum of monthly pay × billable" className="lg:col-span-5">
            <RunRateByType employees={filtered} />
          </ChartCard>

          {/* Pay distribution histogram */}
          <ChartCard title="Pay Distribution" hint="Monthly pay buckets across active staff" className="lg:col-span-4">
            <PayHistogram employees={filtered.filter(isActive)} />
          </ChartCard>

          {/* Benefits adoption (W2) */}
          <ChartCard title="Benefits Adoption" hint={`Among ${metrics.w2Count} W2 employees`} className="lg:col-span-3">
            {metrics.w2Count === 0 ? (
              <EmptyChart label="No W2 employees in scope" />
            ) : (
              <div className="space-y-4">
                <RingScore
                  label="Medical Benefit"
                  pct={metrics.w2Count ? Math.round((metrics.withMedical / metrics.w2Count) * 100) : 0}
                  tone="emerald"
                  icon={Heart}
                  rawCount={metrics.withMedical}
                  rawTotal={metrics.w2Count}
                />
                <RingScore
                  label="401(k) Enrollment"
                  pct={metrics.w2Count ? Math.round((metrics.with401k / metrics.w2Count) * 100) : 0}
                  tone="amber"
                  icon={Wallet}
                  rawCount={metrics.with401k}
                  rawTotal={metrics.w2Count}
                />
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      {/* TRENDS */}
      <section>
        <SectionHeader title="Hiring Trends" subtitle="Monthly inflow over the last year — total, and W-2 vs Offshore." />
        <div className="grid gap-4 lg:grid-cols-12">
          <ChartCard title="Hiring Trend — W-2 vs Offshore" hint="New hires per month · last 12 months" icon={TrendingUp} className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-7" style={{ animationDelay: '40ms' }}>
            {monthlyHiresByType.every((m) => m.total === 0) ? (
              <EmptyChart label="No hiring activity in the last 12 months" />
            ) : (
              <TrendAreaChart
                data={monthlyHiresByType}
                xKey="month"
                height={250}
                areas={[
                  { key: 'total', name: 'Total', color: VIZ.brand },
                  { key: 'W2', name: 'W-2', color: VIZ.blue },
                  { key: 'Offshore', name: 'Offshore', color: VIZ.pink },
                ]}
              />
            )}
          </ChartCard>
          <ChartCard title="Monthly Hires (12 months)" hint="Total new hires per month" icon={Calendar} className="animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] lg:col-span-5" style={{ animationDelay: '120ms' }}>
            {monthlyHires.every((m) => m.value === 0) ? (
              <EmptyChart label="No hiring activity" />
            ) : (
              <CompareBarChart
                data={monthlyHires.map((m) => ({ month: m.label, Hires: m.value }))}
                xKey="month"
                height={250}
                bars={[{ key: 'Hires', name: 'Hires', color: VIZ.violet }]}
              />
            )}
          </ChartCard>
        </div>
      </section>

      {/* DEMOGRAPHICS */}
      <section>
        <SectionHeader title="Tenure & Demographics" subtitle="How long employees have been on the books and their age profile." />
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          <ChartCard title="Tenure Distribution" hint="Years with the company">
            <BucketBars
              data={Object.entries(metrics.tenureBuckets).map(([label, value]) => ({ label, value }))}
              accent="#8b5cf6"
            />
          </ChartCard>
          <ChartCard title="Age Distribution" hint="Across active + terminated">
            <BucketBars
              data={Object.entries(metrics.ageBuckets).map(([label, value]) => ({ label, value }))}
              accent="#ec4899"
            />
          </ChartCard>
        </div>
      </section>

      {/* UPCOMING CELEBRATIONS */}
      <section>
        <SectionHeader title="Upcoming Celebrations" subtitle="Birthdays and work anniversaries in the next 30 days — click a card to see everyone." />
        <div className="grid gap-4 lg:grid-cols-2">
          <CelebrationCard
            title="Upcoming Birthdays"
            subtitle={`Next 30 days · ${upcomingBirthdays.length} ${upcomingBirthdays.length === 1 ? 'person' : 'people'}`}
            icon={Cake}
            tone="pink"
            people={upcomingBirthdays}
            dateGetter={(e) => e.dob}
            onOpen={() => upcomingBirthdays.length > 0 && setDrill({
              title: 'Upcoming Birthdays',
              description: 'Birthdays in the next 30 days.',
              icon: Cake, tone: 'pink',
              people: upcomingBirthdays,
              contextGetter: ctxBirthday,
            })}
          />
          <CelebrationCard
            title="Work Anniversaries"
            subtitle={`Next 30 days · ${upcomingAnniversaries.length} ${upcomingAnniversaries.length === 1 ? 'person' : 'people'}`}
            icon={Award}
            tone="emerald"
            people={upcomingAnniversaries}
            dateGetter={(e) => e.hireDate}
            showYears
            onOpen={() => upcomingAnniversaries.length > 0 && setDrill({
              title: 'Work Anniversaries',
              description: 'Work anniversaries in the next 30 days.',
              icon: Award, tone: 'emerald',
              people: upcomingAnniversaries,
              contextGetter: ctxAnniversary,
            })}
          />
        </div>
      </section>

      {/* GEOGRAPHIC */}
      <section>
        <SectionHeader title="Geographic Distribution" subtitle="Where your workforce is concentrated." />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Top States" hint="Click a row to see who" icon={MapPin}>
            {topStates.length === 0 ? (
              <EmptyChart label="No state data" />
            ) : (
              <HBarList items={topStates} accent="bg-sky-500" onSelect={(label) => openState(label)} />
            )}
          </ChartCard>
          <ChartCard title="Top Cities" hint="Click a row to see who" icon={MapPin}>
            {topCities.length === 0 ? (
              <EmptyChart label="No city data" />
            ) : (
              <HBarList items={topCities} accent="bg-brand-500" onSelect={(label) => openCity(label)} />
            )}
          </ChartCard>
        </div>
      </section>

      {/* CLIENT / VENDOR NETWORK */}
      <section>
        <SectionHeader title="Client & Vendor Network" subtitle="Where placements are concentrated, including end-client and end-vendor chains." />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Top Clients" hint="Click a row to see placements" icon={Building2}>
            {topClients.length === 0 ? <EmptyChart label="No client placements" /> : (
              <HBarList items={topClients.map((c) => ({ label: c.name, value: c.count, key: c.id }))} accent="bg-emerald-500" onSelect={(_, key) => key && openClient(key)} />
            )}
          </ChartCard>
          <ChartCard title="Top Vendors" hint="Click a row to see placements" icon={Package}>
            {topVendors.length === 0 ? <EmptyChart label="No vendor placements" /> : (
              <HBarList items={topVendors.map((v) => ({ label: v.name, value: v.count, key: v.id }))} accent="bg-purple-500" onSelect={(_, key) => key && openVendor(key)} />
            )}
          </ChartCard>
          <ChartCard title="Top End-Clients" hint="Click a row to see placements" icon={Building2}>
            {topEndClients.length === 0 ? <EmptyChart label="No end-client data" /> : (
              <HBarList items={topEndClients.map((c) => ({ label: c.name, value: c.count, key: c.id }))} accent="bg-teal-500" onSelect={(_, key) => key && openClient(key)} />
            )}
          </ChartCard>
          <ChartCard title="Top End-Vendors" hint="Click a row to see placements" icon={Package}>
            {topEndVendors.length === 0 ? <EmptyChart label="No end-vendor data" /> : (
              <HBarList items={topEndVendors.map((v) => ({ label: v.name, value: v.count, key: v.id }))} accent="bg-amber-500" onSelect={(_, key) => key && openVendor(key)} />
            )}
          </ChartCard>
        </div>
      </section>

      {/* OFFSHORE-SPECIFIC */}
      {metrics.offshoreTotal > 0 && (
        <section>
          <SectionHeader title="Offshore Workforce" subtitle="India-specific compliance, payroll, and ID coverage." />
          <div className="grid gap-4 lg:grid-cols-12">
            <ChartCard title="Payroll Entity" hint="Offshore staff by entity" className="lg:col-span-3" icon={Briefcase}>
              {Object.keys(metrics.offshorePayrollDist).length === 0 ? <EmptyChart label="No entity data" /> : (
                <DonutChart
                  data={Object.entries(metrics.offshorePayrollDist).map(([name, value], i) => ({
                    name, value, color: [VIZ.pink, VIZ.violet, VIZ.sky, VIZ.amber][i % 4],
                  }))}
                  height={200}
                />
              )}
            </ChartCard>
            <ChartCard title="Employment Type" hint="Contract vs Full Time" className="lg:col-span-3" icon={Briefcase}>
              {Object.keys(metrics.offshoreEmpDist).length === 0 ? <EmptyChart label="No employment-type data" /> : (
                <DonutChart
                  data={Object.entries(metrics.offshoreEmpDist).map(([name, value], i) => ({
                    name, value, color: [VIZ.sky, VIZ.teal, VIZ.violet, VIZ.amber][i % 4],
                  }))}
                  height={200}
                />
              )}
            </ChartCard>
            <ChartCard title="India ID Coverage" hint="% of offshore staff with each ID on file" className="lg:col-span-6" icon={FileCheck}>
              <div className="space-y-3">
                <RingScore label="Aadhar on file" tone="brand"  rawCount={metrics.offshoreWithAadhar} rawTotal={metrics.offshoreTotal} pct={metrics.offshoreTotal ? Math.round((metrics.offshoreWithAadhar / metrics.offshoreTotal) * 100) : 0} />
                <RingScore label="PAN on file"    tone="emerald" rawCount={metrics.offshoreWithPan}    rawTotal={metrics.offshoreTotal} pct={metrics.offshoreTotal ? Math.round((metrics.offshoreWithPan / metrics.offshoreTotal) * 100) : 0} />
                <RingScore label="PF enrolled"    tone="amber"   rawCount={metrics.offshoreWithPf}     rawTotal={metrics.offshoreTotal} pct={metrics.offshoreTotal ? Math.round((metrics.offshoreWithPf / metrics.offshoreTotal) * 100) : 0} />
              </div>
            </ChartCard>
          </div>
        </section>
      )}

      <footer className="surface px-5 py-3 text-xs text-slate-500">
        Derived live from {employees.length.toLocaleString()} record{employees.length === 1 ? '' : 's'} ·
        Currently showing {filtered.length.toLocaleString()} after filters ·
        Last refreshed {format(new Date(), 'MMM d, yyyy · HH:mm')}
      </footer>

      {/* Unified drill-down modal for every clickable chart */}
      <PeopleListModal
        isOpen={drill !== null}
        onClose={() => setDrill(null)}
        title={drill?.title ?? ''}
        description={drill?.description}
        people={drill?.people ?? []}
        contextGetter={drill?.contextGetter}
        icon={drill?.icon}
        tone={drill?.tone}
      />
    </div>
  );
}

// ───────────── CelebrationCard (spacious birthdays / anniversaries) ─────────────
function CelebrationCard({
  title, subtitle, icon: Icon, tone, people, dateGetter, showYears, onOpen,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: 'pink' | 'emerald';
  people: Employee[];
  dateGetter: (e: Employee) => string | undefined;
  showYears?: boolean;
  onOpen: () => void;
}) {
  const toneMap = {
    pink:    { iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',    chip: 'bg-pink-50 text-pink-700 ring-pink-200',       avatar: 'bg-pink-100 text-pink-700' },
    emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', avatar: 'bg-emerald-100 text-emerald-700' },
  } as const;
  const t = toneMap[tone];
  const preview = people.slice(0, 4);
  const overflow = people.length - preview.length;
  const now = new Date();

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={people.length === 0}
      className="surface surface-hover group flex h-full w-full flex-col text-left disabled:cursor-default disabled:opacity-90 disabled:hover:translate-y-0 disabled:hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', t.iconBg)}>
            <Icon className={cn('h-5 w-5', t.iconColor)} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ring-1', t.chip)}>
          {people.length}
        </span>
      </div>

      <div className="flex-1 px-5 py-5 sm:px-6 sm:py-6">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', t.iconBg)}>
              <Icon className={cn('h-6 w-6', t.iconColor)} />
            </div>
            <p className="text-sm font-semibold text-slate-700">None in the next 30 days</p>
            <p className="text-xs text-slate-500">We&apos;ll let you know when one comes up.</p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {preview.map((p) => {
              const raw = dateGetter(p);
              const d = raw ? new Date(raw) : null;
              const valid = d && !Number.isNaN(d.getTime());
              const thisYear = valid && d ? new Date(now.getFullYear(), d.getMonth(), d.getDate()) : null;
              if (thisYear && thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
              const dateLabel = thisYear ? format(thisYear, 'MMM d') : '—';
              const days = thisYear ? Math.round((thisYear.getTime() - now.getTime()) / 86400000) : null;
              const years = showYears && valid && d && thisYear ? thisYear.getFullYear() - d.getFullYear() : null;
              return (
                <li key={p.id} className="flex items-center gap-3.5">
                  <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold', t.avatar)}>
                    {p.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {p.position || '—'}
                      {years !== null && <span className="text-slate-400"> · {years}y</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-900">{dateLabel}</p>
                    {days !== null && (
                      <p className="text-[11px] text-slate-400">
                        {days === 0 ? 'today' : `in ${days}d`}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {people.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs sm:px-6">
          <span className="text-slate-500">
            {overflow > 0 ? `+${overflow} more` : 'Click to see everyone'}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:text-brand-700">
            <Users className="h-3.5 w-3.5" />
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </button>
  );
}

// ════════════════════════ Sub-components ════════════════════════

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-100 pb-3 sm:mb-6">
      <div>
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">
          <span className="h-px w-6 bg-brand-300" />
          Section
        </span>
        <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title, hint, icon: Icon, className, style, children,
}: {
  title: string; hint?: string; icon?: React.ElementType; className?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div className={cn('surface surface-hover p-5 sm:p-6', className)} style={style}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Icon className="h-4 w-4 text-slate-500" />
            </div>
          )}
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 sm:text-[15px]">{title}</h3>
            {hint && <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">{hint}</p>}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-slate-400">
      {label}
    </div>
  );
}

const TONE: Record<string, { bg: string; iconBg: string; iconColor: string; ring: string; textValue: string }> = {
  red:     { bg: 'bg-red-50',     iconBg: 'bg-red-100',     iconColor: 'text-red-600',     ring: 'ring-red-200',     textValue: 'text-red-700' },
  amber:   { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   ring: 'ring-amber-200',   textValue: 'text-amber-700' },
  yellow:  { bg: 'bg-yellow-50',  iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-700', ring: 'ring-yellow-200',  textValue: 'text-yellow-800' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', ring: 'ring-emerald-200', textValue: 'text-emerald-700' },
  brand:  { bg: 'bg-brand-50',  iconBg: 'bg-brand-100',  iconColor: 'text-brand-600',  ring: 'ring-brand-200',  textValue: 'text-brand-700' },
  purple:  { bg: 'bg-purple-50',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  ring: 'ring-purple-200',  textValue: 'text-purple-700' },
  pink:    { bg: 'bg-pink-50',    iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',    ring: 'ring-pink-200',    textValue: 'text-pink-700' },
  sky:     { bg: 'bg-sky-50',     iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     ring: 'ring-sky-200',     textValue: 'text-sky-700' },
};

function AlertCard({
  tone, icon: Icon, label, value, sub, onClick,
}: {
  tone: 'red' | 'amber' | 'yellow' | 'emerald';
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex h-full w-full flex-col justify-between gap-3 rounded-2xl p-5 text-left ring-1 transition-all',
        t.bg, t.ring,
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', t.iconBg)}>
          <Icon className={cn('h-5 w-5', t.iconColor)} />
        </div>
        {onClick && <ChevronRight className={cn('h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100', t.iconColor)} />}
      </div>
      <div>
        <p className={cn('font-display text-4xl font-bold tabular-nums leading-none', t.textValue)}>{value.toLocaleString()}</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </Wrapper>
  );
}

function KpiTile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone: 'brand' | 'emerald' | 'purple' | 'pink' | 'sky' | 'amber';
}) {
  const t = TONE[tone];
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.iconBg)}>
          <Icon className={cn('h-4 w-4', t.iconColor)} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-slate-900 leading-tight">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ───────────────────── DRILL CHIPS (clickable legend under shared DonutChart) ─────────────────────
// Keeps the drill-down behaviour the shared DonutChart can't express on its own.
function DrillChips({
  items, onSelect,
}: {
  items: { key: string; label: string; value: number; color: string }[];
  onSelect: (key: string) => void;
}) {
  const total = items.reduce((s, d) => s + d.value, 0);
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((d) => {
        const pct = total ? Math.round((d.value / total) * 100) : 0;
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onSelect(d.key)}
            title={`${d.label}: ${d.value} (${pct}%) — click to see who`}
            className="group inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="truncate">{d.label}</span>
            <span className="font-bold tabular-nums text-slate-900">{d.value}</span>
            <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────── HORIZONTAL BAR LIST ─────────────────────
function HBarList({
  items, accent, onSelect,
}: {
  items: { label: string; value: number; key?: string }[];
  accent: string;
  onSelect?: (label: string, key?: string) => void;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.label + (item.key || '')}>
            <button
              type="button"
              onClick={() => onSelect?.(item.label, item.key)}
              className="block w-full text-left group"
              title={`${item.label}: ${item.value}`}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 ml-2">{item.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={cn('h-full rounded-full transition-all', accent)} style={{ width: `${pct}%` }} />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ───────────────────── EXPIRY BUCKETS ─────────────────────
function ExpiryBuckets({
  expired, in30, in60, in90, beyond, onSelect,
}: {
  expired: number; in30: number; in60: number; in90: number; beyond: number;
  onSelect?: (bucket: 'expired' | 'in30' | 'in60' | 'in90' | 'beyond') => void;
}) {
  const buckets = [
    { key: 'expired' as const, label: 'Expired',    value: expired, color: '#ef4444' },
    { key: 'in30' as const,    label: '0–30 days',  value: in30,    color: '#f59e0b' },
    { key: 'in60' as const,    label: '31–60 days', value: in60,    color: '#eab308' },
    { key: 'in90' as const,    label: '61–90 days', value: in90,    color: '#0ea5e9' },
    { key: 'beyond' as const,  label: '90+ days',   value: beyond,  color: '#94a3b8' },
  ];
  const max = Math.max(...buckets.map((b) => b.value), 1);
  const total = buckets.reduce((s, b) => s + b.value, 0);
  if (total === 0) return <EmptyChart label="No expiry data" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1.5 h-32">
        {buckets.map((b) => {
          const h = (b.value / max) * 100;
          const clickable = b.value > 0 && Boolean(onSelect);
          return (
            <button
              key={b.label}
              type="button"
              onClick={clickable ? () => onSelect!(b.key) : undefined}
              disabled={!clickable}
              className={cn(
                'group flex flex-1 flex-col items-center justify-end gap-1.5',
                clickable && 'cursor-pointer'
              )}
              title={`${b.label}: ${b.value}${clickable ? ' — click to see who' : ''}`}
            >
              <span className="text-[10px] font-bold tabular-nums text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{b.value}</span>
              <div
                className={cn('w-full rounded-t-md transition-all', clickable && 'group-hover:brightness-110 group-hover:scale-y-[1.05] origin-bottom')}
                style={{ height: `${h}%`, backgroundColor: b.color, minHeight: b.value > 0 ? 8 : 0 }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
        {buckets.map((b) => (
          <span key={b.label} className="flex-1 truncate text-center">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────── MINI STAT ─────────────────────
function MiniStat({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', t.iconBg)}>
        <Icon className={cn('h-4 w-4', t.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-base font-bold tabular-nums text-slate-900">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ───────────────────── RING SCORE ─────────────────────
function RingScore({
  label, pct, tone, icon: Icon, rawCount, rawTotal,
}: {
  label: string; pct: number; tone: keyof typeof TONE; icon?: React.ElementType; rawCount?: number; rawTotal?: number;
}) {
  const t = TONE[tone];
  const size = 40, stroke = 5, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <div className="flex items-center gap-3" title={rawCount != null && rawTotal != null ? `${rawCount} / ${rawTotal} (${pct}%)` : `${pct}%`}>
      <svg width={size} height={size} className="-rotate-90 flex-shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-slate-100" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={cn(t.iconColor.replace('text-', 'stroke-'))} strokeWidth={stroke} strokeDasharray={`${filled} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          {Icon && <Icon className={cn('h-3.5 w-3.5', t.iconColor)} />}
          <p className="text-xs font-medium text-slate-700 truncate">{label}</p>
        </div>
        <p className={cn('text-sm font-bold tabular-nums', t.textValue)}>
          {pct}%
          {rawCount != null && rawTotal != null && (
            <span className="ml-1.5 text-[10px] font-medium text-slate-400">{rawCount} / {rawTotal}</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ───────────────────── RUN-RATE BY TYPE ─────────────────────
function RunRateByType({ employees }: { employees: Employee[] }) {
  const data = useMemo(() => {
    const m: Record<EmployeeType, { active: number; total: number; billableRevenue: number }> = {
      W2:       { active: 0, total: 0, billableRevenue: 0 },
      Contract: { active: 0, total: 0, billableRevenue: 0 },
      '1099':   { active: 0, total: 0, billableRevenue: 0 },
      Offshore: { active: 0, total: 0, billableRevenue: 0 },
    };
    employees.forEach((e) => {
      m[e.type].total += 1;
      if (isActive(e)) {
        m[e.type].active += 1;
        if ('revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B') {
          m[e.type].billableRevenue += monthlyPay(e);
        }
      }
    });
    return (Object.entries(m) as [EmployeeType, typeof m[EmployeeType]][])
      .map(([type, v]) => ({ type, ...v }));
  }, [employees]);

  const max = Math.max(...data.map((d) => d.billableRevenue), 1);
  const grand = data.reduce((s, d) => s + d.billableRevenue, 0);

  if (grand === 0) return <EmptyChart label="No billable revenue data" />;

  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const w = (d.billableRevenue / max) * 100;
        return (
          <li key={d.type} title={`${d.type}: ${compactCurrency(d.billableRevenue)} (${d.active} active)`}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-sm', TYPE_COLOR[d.type].bg)} />
                <span className="font-medium text-slate-700">{d.type}</span>
              </div>
              <span className="font-semibold tabular-nums text-slate-900">{compactCurrency(d.billableRevenue)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full transition-all', TYPE_COLOR[d.type].bg)} style={{ width: `${w}%` }} />
            </div>
          </li>
        );
      })}
      <li className="border-t border-slate-100 pt-2.5 text-xs text-slate-500 flex items-center justify-between">
        <span>Total monthly run-rate</span>
        <span className="font-bold tabular-nums text-emerald-700">{compactCurrency(grand)}</span>
      </li>
    </ul>
  );
}

// ───────────────────── PAY HISTOGRAM ─────────────────────
function PayHistogram({ employees }: { employees: Employee[] }) {
  const buckets = useMemo(() => {
    const ranges = [
      { label: '<$3K',     min: 0,     max: 3000 },
      { label: '$3–6K',    min: 3000,  max: 6000 },
      { label: '$6–10K',   min: 6000,  max: 10000 },
      { label: '$10–15K',  min: 10000, max: 15000 },
      { label: '$15K+',    min: 15000, max: Infinity },
    ];
    const counts = ranges.map((r) => ({ ...r, count: 0 }));
    employees.forEach((e) => {
      const p = monthlyPay(e);
      if (p <= 0) return;
      const b = counts.find((c) => p >= c.min && p < c.max);
      if (b) b.count += 1;
    });
    return counts;
  }, [employees]);

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (total === 0) return <EmptyChart label="No pay data" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-32 items-end gap-1.5">
        {buckets.map((b) => {
          const h = (b.count / max) * 100;
          return (
            <div key={b.label} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-bold tabular-nums text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{b.count}</span>
              <div className="w-full rounded-t-md bg-emerald-500 transition-all" style={{ height: `${h}%`, minHeight: b.count > 0 ? 8 : 0 }} title={`${b.label}: ${b.count}`} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
        {buckets.map((b) => (
          <span key={b.label} className="flex-1 truncate text-center">{b.label}</span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────── BUCKET BARS ─────────────────────
function BucketBars({ data, accent }: { data: { label: string; value: number }[]; accent: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart label="No data" />;
  return (
    <ul className="space-y-2">
      {data.map((d) => {
        const pct = total ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.label} title={`${d.label}: ${d.value} (${pct}%)`}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{d.label}</span>
              <span className="font-semibold tabular-nums text-slate-900">{d.value}<span className="ml-1.5 text-slate-400">({pct}%)</span></span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: accent }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ───────────────────── PEOPLE LIST ─────────────────────
function PeopleList({
  people, dateGetter, icon: Icon, tone, anniversaryYears,
}: {
  people: Employee[];
  dateGetter: (e: Employee) => string | undefined;
  icon: React.ElementType;
  tone: 'pink' | 'emerald';
  anniversaryYears?: boolean;
}) {
  const t = TONE[tone];
  if (people.length === 0) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
        <Icon className={cn('h-5 w-5', t.iconColor)} />
        <span>None in next 30 days</span>
      </div>
    );
  }
  const now = new Date();
  return (
    <ul className="space-y-2">
      {people.map((p) => {
        const raw = dateGetter(p);
        const d = raw ? new Date(raw) : null;
        const labelDate = d && !Number.isNaN(d.getTime()) ? format(d, 'MMM d') : '—';
        const years = anniversaryYears && d ? differenceInYears(now, d) : null;
        return (
          <li key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0', t.iconBg)}>
              <Icon className={cn('h-3.5 w-3.5', t.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{p.name}</p>
              <p className="text-[11px] text-slate-500">
                {labelDate}{years !== null && ` · ${years}y`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
