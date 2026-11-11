const resultNames = { VERIFIED: 'Eligible for committee review', MANUAL_REVIEW: 'Additional review required', INELIGIBLE: 'Currently ineligible', FAILED: 'Vetting could not be completed' };

export function VettingExplanation({ run }) {
  if (!run) return null;
  return <section className={`vetting-explanation vetting-explanation--${String(run.status).toLowerCase()}`}><p className="section-kicker">Need Index result</p><h2>{resultNames[run.status] ?? run.status.replaceAll('_', ' ')}</h2>{run.score !== null && run.score !== undefined && <p className="vetting-score"><strong>{Number(run.score).toFixed(0)}</strong><span>out of 100</span></p>}<p>{run.explanation ?? 'The system assessed the available simulated university record using the active vetting policy.'}</p>{run.policy && <small>Policy: {run.policy.name} ({run.policy.version})</small>}</section>;
}
