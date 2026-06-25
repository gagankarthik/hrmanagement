'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Canonical form-control styling — identical to the inline `field` token that
// was hand-copied across every dashboard form, so adopting these atoms is a
// pure refactor with zero visual change. The `invalid` prop reproduces the
// existing red error-border treatment and also sets aria-invalid.
export const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-50';
export const invalidFieldClass =
  'border-red-300 focus:border-red-400 focus:ring-red-50';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldClass, invalid && invalidFieldClass, className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldClass, invalid && invalidFieldClass, className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldClass, invalid && invalidFieldClass, className)}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = 'NativeSelect';
