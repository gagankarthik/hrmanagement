'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  /** Optional reassurance line shown in a subtle panel, e.g. what's retained. */
  reassurance?: React.ReactNode;
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
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    button: 'bg-brand-600 hover:bg-brand-700 shadow-brand-200',
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
  reassurance,
}: ConfirmDialogProps) {
  const styles = toneStyles[tone];
  const titleId = React.useId();
  const descId = React.useId();
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock background scroll while the dialog is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
        aria-hidden
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="surface relative z-10 w-full max-w-md p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="flex flex-col items-center text-center">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl ring-4 ring-white', styles.iconBg)}>
            <AlertTriangle className={cn('h-7 w-7', styles.iconColor)} strokeWidth={1.75} />
          </div>
          <h3 id={titleId} className="mt-4 font-display text-xl font-bold text-slate-900">{title}</h3>
          {description && (
            <div id={descId} className="mt-2 text-sm leading-relaxed text-slate-600">{description}</div>
          )}
          {reassurance && (
            <p className="mt-4 w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-500">
              {reassurance}
            </p>
          )}
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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
