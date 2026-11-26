import type { ElementType, ReactNode } from 'react';

export interface CommonCardProps {
  as?: ElementType;
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Card({
  as: Tag = 'section',
  title,
  actions,
  children,
  className = '',
}: CommonCardProps) {
  return (
    <Tag className={`card ${className}`.trim()}>
      {(title || actions) && (
        <header className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="card__body">{children}</div>
    </Tag>
  );
}
