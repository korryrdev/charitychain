export function EmptyState({ title = 'Nothing to show yet', children, action }) { return <section className="empty-state"><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>; }
