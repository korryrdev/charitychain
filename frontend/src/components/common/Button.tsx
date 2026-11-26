import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface CommonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: string;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  ...props
}: CommonButtonProps) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}
