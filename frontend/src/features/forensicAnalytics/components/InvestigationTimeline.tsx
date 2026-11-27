import type { ForensicAnomaly } from './AnomalySummary';

export interface InvestigationFinding {
  note: string;
  at?: string;
}

export interface InvestigationTimelineProps {
  anomaly?: (ForensicAnomaly & {
    investigation?: {
      status: string;
      summary?: string;
      conclusion?: string | null;
      findings?: InvestigationFinding[] | null;
      openedAt?: string;
      closedAt?: string | null;
    } | null;
  }) | null;
}

export function InvestigationTimeline({ anomaly }: InvestigationTimelineProps) {
  const investigation = anomaly?.investigation;
  if (!investigation) {
    return <p className="muted">No investigation has been opened for this anomaly.</p>;
  }
  const findings = Array.isArray(investigation.findings) ? investigation.findings : [];

  return (
    <section className="investigation-timeline portal-card">
      <h2>Investigation</h2>
      <p>
        <strong>{investigation.status}</strong> &middot;{' '}
        {investigation.conclusion ?? investigation.summary ?? 'No conclusion recorded yet.'}
      </p>
      <small>
        Opened{' '}
        {investigation.openedAt ? new Date(investigation.openedAt).toLocaleString('en-KE') : '—'}
        {investigation.closedAt
          ? ` · Closed ${new Date(investigation.closedAt).toLocaleString('en-KE')}`
          : ''}
      </small>

      {findings.length > 0 && (
        <ul className="timeline-list">
          {findings.map((item, idx) => (
            <li key={`${item.at ?? 'finding'}-${idx}`}>
              <span>{item.note}</span>
              {item.at && (
                <small className="muted"> ({new Date(item.at).toLocaleString('en-KE')})</small>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
