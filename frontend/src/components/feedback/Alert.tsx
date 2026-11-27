import type { ReactNode } from 'react';

export interface AlertProps {
  tone?: string;
  title: ReactNode;
  children?: ReactNode;
}

export function Alert({ tone = 'info', title, children }: AlertProps) {
  return (
    <section className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </section>
  );
}
