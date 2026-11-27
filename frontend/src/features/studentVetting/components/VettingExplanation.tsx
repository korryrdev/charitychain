const resultNames: Record<string, string> = {
  VERIFIED: 'Eligible for committee review',
  MANUAL_REVIEW: 'Additional review required',
  INELIGIBLE: 'Currently ineligible',
  FAILED: 'Vetting could not be completed',
};

export interface VettingPolicyInfo {
  name: string;
  version: string | number;
}

export interface VettingRunSummary {
  status: string;
  score?: number | string | null;
  explanation?: string | null;
  policy?: VettingPolicyInfo | null;
}

export interface VettingExplanationProps {
  run?: VettingRunSummary | null;
}

export function VettingExplanation({ run }: VettingExplanationProps) {
  if (!run) return null;
  return (
    <section className={`vetting-explanation vetting-explanation--${String(run.status).toLowerCase()}`}>
      <p className="section-kicker">Need Index result</p>
      <h2>{resultNames[run.status] ?? run.status.replaceAll('_', ' ')}</h2>
      {run.score !== null && run.score !== undefined && (
        <p className="vetting-score">
          <strong>{Number(run.score).toFixed(0)}</strong>
          <span>out of 100</span>
        </p>
      )}
      <p>
        {run.explanation ??
          'The system assessed the available university record using the active vetting policy.'}
      </p>
      {run.policy && (
        <small>
          Policy: {run.policy.name} ({run.policy.version})
        </small>
      )}
    </section>
  );
}
