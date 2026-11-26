import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { forensicsApi } from '../../features/forensicAnalytics/services/forensics.api';
import { getErrorMessage } from '../../services/errorMapper';

interface ForensicAnomalySummary {
  id: string;
  ruleCode?: string;
  type?: string;
  severity: string;
  status?: string;
  investigation?: {
    status?: string;
  } | null;
}

export function AnomalyCasesPage() {
  const [items, setItems] = useState<ForensicAnomalySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    try {
      await forensicsApi.scan();
      const result = await forensicsApi.anomalies();
      setItems((result.items ?? []) as ForensicAnomalySummary[]);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to run forensic scan.'));
    }
  };

  useEffect(() => {
    forensicsApi
      .anomalies()
      .then((value) => setItems((value.items ?? value.anomalies ?? []) as ForensicAnomalySummary[]))
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Failed to load anomalies.')));
  }, []);

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Forensic cases</p>
      <h1>Detected anomalies</h1>
      <button className="secondary-button" onClick={scan}>
        Run controlled scan
      </button>
      {error && <p className="form-error">{error}</p>}
      <div className="anomaly-list">
        {items.map((item) => (
          <Link key={item.id} to={`/auditor/anomalies/${item.id}`}>
            <strong>{item.ruleCode ?? item.type}</strong>
            <span>{item.severity}</span>
            <small>{item.status ?? item.investigation?.status ?? 'UNREVIEWED'}</small>
          </Link>
        ))}
      </div>
    </main>
  );
}
