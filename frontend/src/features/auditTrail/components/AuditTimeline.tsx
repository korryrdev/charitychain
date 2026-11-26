export interface AuditEventItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string | number | Date;
}

export interface AuditTimelineProps {
  items?: AuditEventItem[];
}

export function AuditTimeline({ items = [] }: AuditTimelineProps) {
  return (
    <ol className="audit-timeline">
      {items.map((event) => (
        <li key={event.id}>
          <strong>{event.action}</strong>
          <span>
            {event.entityType} · {event.entityId ?? '—'}
          </span>
          <small>{new Date(event.createdAt).toLocaleString('en-KE')}</small>
        </li>
      ))}
    </ol>
  );
}
