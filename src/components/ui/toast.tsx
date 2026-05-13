'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastInput = Omit<Toast, 'id'> & { id?: string };

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: ToastInput) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = input.id ?? Math.random().toString(36).slice(2, 10);
      const next: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'info',
        duration: input.duration ?? DEFAULT_DURATION,
      };
      setToasts((prev) => [...prev, next]);
      if (next.duration && next.duration > 0) {
        const timer = setTimeout(() => dismiss(id), next.duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = React.useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'success' }),
    [toast]
  );
  const error = React.useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'error' }),
    [toast]
  );
  const warning = React.useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'warning' }),
    [toast]
  );
  const info = React.useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'info' }),
    [toast]
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = React.useMemo(
    () => ({ toasts, toast, dismiss, success, error, warning, info }),
    [toasts, toast, dismiss, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, { ring: string; iconBg: string; iconColor: string; icon: React.ElementType }> = {
  success: {
    ring: 'ring-emerald-200',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: CheckCircle2,
  },
  error: {
    ring: 'ring-red-200',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    icon: AlertCircle,
  },
  warning: {
    ring: 'ring-amber-200',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: AlertTriangle,
  },
  info: {
    ring: 'ring-indigo-200',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: Info,
  },
};

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 px-4 pb-4 sm:items-end sm:px-6 sm:pb-6"
    >
      {toasts.map((t) => {
        const v = variantStyles[t.variant ?? 'info'];
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200',
              'animate-in slide-in-from-right-5 fade-in duration-200',
              v.ring
            )}
          >
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', v.iconBg)}>
              <Icon className={cn('h-5 w-5', v.iconColor)} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
