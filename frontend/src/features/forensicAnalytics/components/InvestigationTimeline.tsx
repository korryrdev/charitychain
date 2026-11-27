import type { ForensicAnomaly } from './AnomalySummary';

export interface InvestigationTimelineProps {
  anomaly?: ForensicAnomaly | null;
}

export function InvestigationTimeline({ anomaly }: InvestigationTimelineProps) {
  const investigation = anomaly?.investigation;
  if (!investigation) return <p className="muted">No investigation has been opened for this anomaly.</p>;
  return (
    <section className="investigation-timeline">
      <h2>Investigation</h2>
      <p>
        <strong>{investigation.status}</strong> ·{' '}
        {investigation.conclusion ?? investigation.summary ?? 'No resolution summary yet.'}
      </p>
      <small>Opened {investigation.openedAt ? new Date(investigation.openedAt).toLocaleString('en-KE') : '—'}</small>
    </section>
  );
}
