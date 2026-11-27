import type { ReactNode } from 'react';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd className={`cc-kbd ${className}`.trim()} aria-hidden="true">
      {children}
    </kbd>
  );
}
