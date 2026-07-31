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
    iconBg: 'bg-[var(--adm-danger-soft)]',
    iconColor: 'text-[var(--adm-danger)]',
    button: 'bg-[var(--adm-danger)] hover:bg-rose-700',
  },
  warning: {
    iconBg: 'bg-[var(--adm-warning-soft)]',
    iconColor: 'text-[var(--adm-warning)]',
    button: 'bg-[var(--adm-warning)] hover:bg-amber-700',
  },
  default: {
    iconBg: 'bg-[var(--adm-accent-soft)]',
    iconColor: 'text-[var(--adm-accent)]',
    button: 'bg-[var(--adm-accent)] hover:bg-[var(--adm-accent-strong)]',
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
        className="absolute inset-0 bg-slate-900/45 animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
        aria-hidden
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="surface relative z-10 w-full max-w-md p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-start gap-3">
          <div className={cn('grid h-9 w-9 flex-none place-items-center rounded-[8px]', styles.iconBg)}>
            <AlertTriangle className={cn('h-4.5 w-4.5', styles.iconColor)} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-[16px] font-semibold leading-6 text-[var(--adm-ink)]">{title}</h3>
            {description && (
              <div id={descId} className="mt-1.5 text-sm leading-relaxed text-[var(--adm-ink-mute)]">{description}</div>
            )}
          </div>
        </div>
        {reassurance && (
          <p className="mt-4 w-full rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3.5 py-2.5 text-left text-xs leading-relaxed text-[var(--adm-ink-mute)]">
            {reassurance}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-ghost disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-3 text-[13.5px] font-semibold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
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
  );
}
