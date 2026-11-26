import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { forensicsApi } from '../../features/forensicAnalytics/services/forensics.api';
import { InvestigationTimeline } from '../../features/forensicAnalytics/components/InvestigationTimeline';
import { getErrorMessage } from '../../services/errorMapper';

interface ForensicInvestigation {
  status: string;
  summary?: string;
  openedAt?: string;
}

interface ForensicAnomaly {
  id: string;
  ruleCode?: string;
  type?: string;
  explanation?: string;
  summary?: string;
  investigation?: ForensicInvestigation | null;
}

export function InvestigationPage() {
  const { anomalyId } = useParams<{ anomalyId: string }>();
  const [anomaly, setAnomaly] = useState<ForensicAnomaly | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!anomalyId) return;
    forensicsApi
      .anomaly(anomalyId)
      .then(({ anomaly: value }) => setAnomaly(value as ForensicAnomaly))
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Failed to load anomaly investigation.')));
  }, [anomalyId]);

  const open = async () => {
    if (!anomalyId) return;
    try {
      setAnomaly((await forensicsApi.open(anomalyId)).anomaly as ForensicAnomaly);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to open investigation.'));
    }
  };

  if (!anomaly) {
    return (
      <main className="portal-page">
        <p className="loading-state">Loading investigation…</p>
        {error && <p className="form-error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="portal-page auditor-page">
      <p className="section-kicker">Forensic investigation</p>
      <h1>{anomaly.ruleCode ?? anomaly.type}</h1>
      <p>{anomaly.explanation ?? anomaly.summary}</p>
      <InvestigationTimeline anomaly={anomaly} />
      {!anomaly.investigation && (
        <button className="primary-button" onClick={open}>
          Open investigation
        </button>
      )}
    </main>
  );
}
