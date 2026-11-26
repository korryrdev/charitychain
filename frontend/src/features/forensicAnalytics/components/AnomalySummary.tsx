export interface ForensicAnomalyInvestigation {
  status?: string | null;
  summary?: string | null;
  openedAt?: string | number | Date | null;
}

export interface ForensicAnomaly {
  severity?: string | null;
  investigation?: ForensicAnomalyInvestigation | null;
}

export interface AnomalySummaryProps {
  anomalies?: ForensicAnomaly[];
}

export function AnomalySummary({ anomalies = [] }: AnomalySummaryProps) {
  const open = anomalies.filter((item) => !['RESOLVED', 'DISMISSED'].includes(item.investigation?.status ?? '')).length;
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
