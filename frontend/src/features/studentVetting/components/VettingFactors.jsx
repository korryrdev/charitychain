const labels = {
  MICRO_PAYMENTS: 'Payment pattern', EXAM_PERIOD_PAYMENTS: 'Exam-period payments', FINANCE_BLOCKS: 'Finance clearance history', AID_RELIANCE: 'Government or scholarship support', UNMET_BALANCE: 'Current unmet fee balance', PREVIOUS_ASSISTANCE: 'Previous support', DUPLICATE_APPLICATION: 'Duplicate application check'
};

export function VettingFactors({ factors = [] }) {
  if (!factors.length) return <p className="muted">Factor-by-factor evidence will appear after the automated vetting run completes.</p>;
  return <div className="vetting-factors">{factors.map((factor) => <article key={factor.factor} className={`vetting-factor vetting-factor--${String(factor.outcome).toLowerCase()}`}><div><h3>{labels[factor.factor] ?? factor.factor.replaceAll('_', ' ')}</h3><p>{factor.explanation}</p></div><strong>{Number(factor.points).toFixed(0)}<small>/{Number(factor.maximumPoints).toFixed(0)}</small></strong></article>)}</div>;
}
