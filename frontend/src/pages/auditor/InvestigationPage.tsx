import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { forensicsApi } from '../../features/forensicAnalytics/services/forensics.api';
import {
  InvestigationTimeline,
  type InvestigationFinding,
} from '../../features/forensicAnalytics/components/InvestigationTimeline';
import { getErrorMessage } from '../../services/errorMapper';

interface ForensicInvestigation {
  status: string;
  summary?: string;
  conclusion?: string | null;
  findings?: InvestigationFinding[] | null;
  openedAt?: string;
  closedAt?: string | null;
}

interface ForensicAnomaly {
  id: string;
  ruleCode?: string;
  type?: string;
  explanation?: string;
  summary?: string;
  status?: string;
  investigation?: ForensicInvestigation | null;
}

export function InvestigationPage() {
  const { anomalyId } = useParams<{ anomalyId: string }>();
  const [anomaly, setAnomaly] = useState<ForensicAnomaly | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finding, setFinding] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [outcome, setOutcome] = useState<'CONFIRMED' | 'DISMISSED' | 'RESOLVED'>('RESOLVED');
  const [closeInvestigation, setCloseInvestigation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!anomalyId) return;
    forensicsApi
      .anomaly(anomalyId)
      .then(({ anomaly: value }) => setAnomaly(value as ForensicAnomaly))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Failed to load anomaly investigation.'))
      );
  }, [anomalyId]);

  const open = async () => {
    if (!anomalyId) return;
    try {
      setError(null);
      setAnomaly((await forensicsApi.open(anomalyId)).anomaly as ForensicAnomaly);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to open investigation.'));
    }
  };

  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!anomalyId) return;
    if (!finding.trim() && !conclusion.trim() && !closeInvestigation) {
      setError('Enter a finding note, conclusion, or check close to save.');
      return;
    }
    setSaving(true);
    try {
      setError(null);
      const updated = await forensicsApi.update(anomalyId, {
        ...(finding.trim() ? { finding: finding.trim() } : {}),
        ...(conclusion.trim() ? { conclusion: conclusion.trim() } : {}),
        close: closeInvestigation,
        ...(closeInvestigation ? { outcome } : {}),
      });
      setAnomaly(updated.anomaly as ForensicAnomaly);
      setFinding('');
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to update forensic investigation.'));
    } finally {
      setSaving(false);
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <InvestigationTimeline anomaly={anomaly} />

      {!anomaly.investigation ? (
        <button type="button" className="primary-button" onClick={open}>
          Open investigation
        </button>
      ) : (
        anomaly.investigation.status !== 'CLOSED' && (
          <form className="portal-card" onSubmit={update}>
            <h2>Record Findings &amp; Update Investigation</h2>
            <label>
              Finding note
              <textarea
                rows={3}
                value={finding}
                onChange={(e) => setFinding(e.target.value)}
                placeholder="Document ledger checks, provider logs, or witness verification..."
              />
            </label>
            <label>
              Conclusion
              <textarea
                rows={2}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Final auditor assessment..."
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={closeInvestigation}
                onChange={(e) => setCloseInvestigation(e.target.checked)}
              />{' '}
              Close investigation on save
            </label>
            {closeInvestigation && (
              <label>
                Final Anomaly Outcome
                <select
                  value={outcome}
                  onChange={(e) =>
                    setOutcome(e.target.value as 'CONFIRMED' | 'DISMISSED' | 'RESOLVED')
                  }
                >
                  <option value="RESOLVED">Resolved</option>
                  <option value="CONFIRMED">Confirmed Misconduct / Breach</option>
                  <option value="DISMISSED">Dismissed (False Positive)</option>
                </select>
              </label>
            )}
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : closeInvestigation ? 'Save & Close Investigation' : 'Append Finding'}
            </button>
          </form>
        )
      )}
    </main>
  );
}
