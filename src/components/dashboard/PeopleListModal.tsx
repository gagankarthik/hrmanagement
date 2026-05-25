'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';

type Tone = 'red' | 'amber' | 'yellow' | 'emerald' | 'sky' | 'pink' | 'purple' | 'brand' | 'slate';

interface PeopleListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  people: Employee[];
  /** Per-person context, e.g. "Expires Mar 4" / "Hired today" */
  contextGetter?: (e: Employee) => { primary?: string; secondary?: string };
  icon?: React.ElementType;
  tone?: Tone;
  /** Optional CTA shown in the footer (e.g. "Open employees list") */
  footerLink?: { href: string; label: string };
}

const TONE: Record<Tone, { iconBg: string; iconColor: string; pill: string; chipText: string }> = {
  red:     { iconBg: 'bg-red-100',     iconColor: 'text-red-600',     pill: 'bg-red-50 ring-red-200',         chipText: 'text-red-700' },
  amber:   { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   pill: 'bg-amber-50 ring-amber-200',     chipText: 'text-amber-700' },
  yellow:  { iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-700', pill: 'bg-yellow-50 ring-yellow-200',    chipText: 'text-yellow-800' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', pill: 'bg-emerald-50 ring-emerald-200', chipText: 'text-emerald-700' },
  sky:     { iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     pill: 'bg-sky-50 ring-sky-200',         chipText: 'text-sky-700' },
  pink:    { iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',    pill: 'bg-pink-50 ring-pink-200',       chipText: 'text-pink-700' },
  purple:  { iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  pill: 'bg-purple-50 ring-purple-200',   chipText: 'text-purple-700' },
  brand:  { iconBg: 'bg-brand-100',  iconColor: 'text-brand-600',  pill: 'bg-brand-50 ring-brand-200',   chipText: 'text-brand-700' },
  slate:   { iconBg: 'bg-slate-100',   iconColor: 'text-slate-600',   pill: 'bg-slate-50 ring-slate-200',     chipText: 'text-slate-700' },
};

const TYPE_BADGE: Record<string, string> = {
  W2: 'bg-blue-50 text-blue-700 ring-blue-200',
  Contract: 'bg-purple-50 text-purple-700 ring-purple-200',
  '1099': 'bg-teal-50 text-teal-700 ring-teal-200',
  Offshore: 'bg-pink-50 text-pink-700 ring-pink-200',
};

export function PeopleListModal({
  isOpen,
  onClose,
  title,
  description,
  people,
  contextGetter,
  icon: Icon = Users,
  tone = 'brand',
  footerLink,
}: PeopleListModalProps) {
  const t = TONE[tone];

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[85vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-3 sm:slide-in-from-bottom-0 sm:fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', t.iconBg)}>
            <Icon className={cn('h-5 w-5', t.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold ring-1', t.pill, t.chipText)}>
                {people.length}
              </span>
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {people.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', t.iconBg)}>
                <Icon className={cn('h-6 w-6', t.iconColor)} />
              </div>
              <p className="text-sm font-semibold text-slate-900">Nothing to show</p>
              <p className="text-xs text-slate-500">There are no employees in this category right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {people.map((emp) => {
                const ctx = contextGetter?.(emp);
                return (
                  <li key={emp.id}>
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 sm:px-6"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                        {emp.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{emp.name}</p>
                          <span className={cn('flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1', TYPE_BADGE[emp.type] || 'bg-slate-50 text-slate-600 ring-slate-200')}>
                            {emp.type}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {emp.position || '—'}
                          {emp.state && <span className="text-slate-400"> · {emp.state}</span>}
                        </p>
                      </div>
                      {ctx && (
                        <div className="hidden flex-shrink-0 text-right sm:block">
                          {ctx.primary && (
                            <p className={cn('text-xs font-semibold tabular-nums', t.chipText)}>{ctx.primary}</p>
                          )}
                          {ctx.secondary && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{ctx.secondary}</p>
                          )}
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </Link>
                    {ctx && (
                      <div className="px-5 pb-2 sm:hidden">
                        {ctx.primary && <span className={cn('mr-2 text-xs font-semibold tabular-nums', t.chipText)}>{ctx.primary}</span>}
                        {ctx.secondary && <span className="text-[11px] text-slate-400">{ctx.secondary}</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {footerLink && people.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
            <Link
              href={footerLink.href}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {footerLink.label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
