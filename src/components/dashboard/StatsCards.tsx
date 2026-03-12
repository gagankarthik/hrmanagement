'use client';

import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  Globe,
  Briefcase,
  AlertTriangle,
  DollarSign,
  Building2,
  Truck,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/context/EmployeeContext';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'teal' | 'pink' | 'emerald' | 'amber';
  onClick?: () => void;
  subtitle?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/50',
    icon: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    icon: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400',
    text: 'text-teal-600 dark:text-teal-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/50',
    icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400',
    text: 'text-pink-600 dark:text-pink-400',
  },
};

function StatCard({ title, value, icon: Icon, color, onClick, subtitle }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 p-5 text-left transition-all hover:shadow-lg dark:border-slate-800',
        'bg-white dark:bg-slate-900',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative gradient */}
      <div
        className={cn(
          'absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 transition-opacity group-hover:opacity-20',
          colors.bg
        )}
      />
    </button>
  );
}

export default function StatsCards() {
  const { stats, setFilters } = useEmployees();

  const handleFilterByType = (type: string) => {
    if (type === 'All') {
      setFilters({ type: 'All' });
    } else {
      setFilters({ type: type as 'W2' | 'Contract' | '1099' | 'Offshore' });
    }
  };

  const handleFilterByStatus = (status: 'Active' | 'Terminated') => {
    setFilters({ status });
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="indigo"
          onClick={() => handleFilterByType('All')}
        />
        <StatCard
          title="Active"
          value={stats.activeCount}
          icon={UserCheck}
          color="green"
          onClick={() => handleFilterByStatus('Active')}
        />
        <StatCard
          title="Terminated"
          value={stats.terminatedCount}
          icon={UserX}
          color="red"
          onClick={() => handleFilterByStatus('Terminated')}
        />
        <StatCard
          title="Expiring Authorizations"
          value={stats.expiringAuthorizations}
          icon={AlertTriangle}
          color="orange"
          subtitle="Next 30 days"
        />
      </div>

      {/* Employee Type Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="W2 Employees"
          value={stats.w2Count}
          icon={Briefcase}
          color="blue"
          onClick={() => handleFilterByType('W2')}
        />
        <StatCard
          title="Contract"
          value={stats.contractCount}
          icon={FileText}
          color="purple"
          onClick={() => handleFilterByType('Contract')}
        />
        <StatCard
          title="1099"
          value={stats.employee1099Count}
          icon={FileText}
          color="teal"
          onClick={() => handleFilterByType('1099')}
        />
        <StatCard
          title="Offshore"
          value={stats.offshoreCount}
          icon={Globe}
          color="pink"
          onClick={() => handleFilterByType('Offshore')}
        />
      </div>

      {/* Revenue & Business Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Billable (B)"
          value={stats.billableCount}
          icon={DollarSign}
          color="emerald"
          subtitle="Revenue generating"
        />
        <StatCard
          title="Non-Billable (NB)"
          value={stats.nonBillableCount}
          icon={DollarSign}
          color="amber"
          subtitle="Support/Internal"
        />
        <StatCard
          title="Unique Clients"
          value={stats.uniqueClients}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Unique Vendors"
          value={stats.uniqueVendors}
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Subcontractor Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Subcontractors"
          value={stats.activeSubcontractors}
          icon={UserCog}
          color="green"
        />
        <StatCard
          title="Inactive Subcontractors"
          value={stats.inactiveSubcontractors}
          icon={UserCog}
          color="red"
        />
      </div>
    </div>
  );
}
