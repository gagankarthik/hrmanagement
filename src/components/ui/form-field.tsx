'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Canonical field label styling — identical to the inline `label` token used
// across the dashboard forms.
export const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';

interface FormFieldProps {
  /** Field label text. Omit for controls that render their own label. */
  label?: React.ReactNode;
  /** Marks the field required (renders the red asterisk). */
  required?: boolean;
  /** Helper text shown below the control when there is no error. */
  hint?: React.ReactNode;
  /** Error message — when present the control is wired to it via aria-describedby. */
  error?: React.ReactNode;
  /** Explicit id for the control; auto-generated otherwise. */
  htmlFor?: string;
  className?: string;
  /** The form control (a single element: Input / NativeSelect / Textarea / Combobox …). */
  children: React.ReactNode;
}

/**
 * Label + control + helper/error wrapper. Codifies the label/error markup that
 * was duplicated in every form and adds accessibility wiring (label↔control id,
 * aria-invalid, aria-describedby) without changing any visuals.
 *
 * The single child control is cloned to receive `id`, `aria-invalid` and
 * `aria-describedby` — all standard attributes safe to land on any element.
 * Pass `invalid={!!error}` on Input/NativeSelect/Textarea for the red border.
 */
export function FormField({ label, required, hint, error, htmlFor, className, children }: FormFieldProps) {
  const reactId = React.useId();
  const baseId = htmlFor ?? reactId;
  const errorId = `${baseId}-error`;
  const hintId = `${baseId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: (children.props as Record<string, unknown>).id ?? baseId,
        'aria-invalid': error ? true : (children.props as Record<string, unknown>)['aria-invalid'],
        'aria-describedby':
          describedBy ?? (children.props as Record<string, unknown>)['aria-describedby'],
      })
    : children;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={baseId} className={labelClass}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
