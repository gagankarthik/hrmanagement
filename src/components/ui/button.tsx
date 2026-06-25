'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Button atom — wraps the existing global `.btn-*` classes so the cobalt/cyan
// visual language is preserved exactly, while adding a standard loading state
// (spinner + aria-busy + auto-disable) and consistent disabled styling.
type ButtonVariant = 'primary' | 'accent' | 'ghost';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner, sets aria-busy, and disables the button. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, type, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(variantClass[variant], 'disabled:opacity-50', className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export default Button;
