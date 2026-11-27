import type { ReactNode } from 'react';

export interface FeedbackEmptyStateProps {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title = 'Nothing to show yet', children, action }: FeedbackEmptyStateProps) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  );
}
