export interface ApplicationHistoryEntry {
  version: number | string;
  createdAt: string | number | Date;
  toStatus: string;
  reason: string;
}

export interface ApplicationTimelineProps {
  history?: ApplicationHistoryEntry[];
}

export function ApplicationTimeline({ history = [] }: ApplicationTimelineProps) {
  return (
    <ol className="application-timeline">
      {history.map((entry, index) => (
        <li key={`${entry.version}-${entry.createdAt}`}>
          <span>{index + 1}</span>
          <div>
            <strong>{entry.toStatus.replaceAll('_', ' ')}</strong>
            <p>{entry.reason.replaceAll('_', ' ')}</p>
            <small>
              {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(entry.createdAt),
              )}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
