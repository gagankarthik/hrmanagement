'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

const toneStyles: Record<NonNullable<ConfirmDialogProps['tone']>, { iconBg: string; iconColor: string; button: string }> = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
  },
  default: {
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const styles = toneStyles[tone];

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', styles.iconBg)}>
            <AlertTriangle className={cn('h-8 w-8', styles.iconColor)} />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
          {description && (
            <div className="mt-2 text-sm text-slate-600">{description}</div>
          )}
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50',
                styles.button
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Working…
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
