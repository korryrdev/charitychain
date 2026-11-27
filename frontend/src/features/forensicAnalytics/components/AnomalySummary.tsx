export interface ForensicAnomalyInvestigation {
  status?: string | null;
  conclusion?: string | null;
  summary?: string | null;
  openedAt?: string | number | Date | null;
}

export interface ForensicAnomaly {
  status?: string | null;
  severity?: string | null;
  investigation?: ForensicAnomalyInvestigation | null;
}

export interface AnomalySummaryProps {
  anomalies?: ForensicAnomaly[];
}

export function AnomalySummary({ anomalies = [] }: AnomalySummaryProps) {
  const open = anomalies.filter((item) =>
    item.status
      ? !['RESOLVED', 'DISMISSED'].includes(item.status)
      : item.investigation?.status !== 'CLOSED'
  ).length;
  return (
    <section className="anomaly-summary">
      <div>
        <span>Cases</span>
        <strong>{anomalies.length}</strong>
      </div>
      <div>
        <span>Open</span>
        <strong>{open}</strong>
      </div>
      <div>
        <span>High priority</span>
        <strong>{anomalies.filter((item) => item.severity === 'HIGH' || item.severity === 'CRITICAL').length}</strong>
      </div>
    </section>
  );
}
