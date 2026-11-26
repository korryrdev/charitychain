import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { forensicsApi } from '../../features/forensicAnalytics/services/forensics.api';
import {
  AnomalySummary,
  type ForensicAnomaly
} from '../../features/forensicAnalytics/components/AnomalySummary';

export function AuditorDashboardPage() {
  const [items, setItems] = useState<ForensicAnomaly[]>([]);

  useEffect(() => {
    forensicsApi
      .anomalies()
      .then((value) => setItems((value.items ?? value.anomalies ?? []) as ForensicAnomaly[]))
      .catch(() => {});
  }, []);

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Audit and forensics</p>
      <h1>Investigate evidence, not assumptions.</h1>
      <AnomalySummary anomalies={items} />
      <div className="auditor-actions">
        <Link to="/auditor/anomalies">Anomaly cases</Link>
        <Link to="/auditor/money">Money audit</Link>
        <Link to="/auditor/goods">Goods audit</Link>
        <Link to="/auditor/blockchain">Blockchain evidence</Link>
      </div>
    </main>
  );
}
