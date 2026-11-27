export interface ReconciliationExceptionItem {
  id: string;
  outcome?: string | null;
  type?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  providerReference?: string | null;
}

export interface ReconciliationResult {
  status?: string | null;
  scope: string;
  periodStart: string | number | Date;
  periodEnd: string | number | Date;
  matchedCount?: number;
  exceptionCount?: number;
  items?: ReconciliationExceptionItem[];
  exceptions?: ReconciliationExceptionItem[];
}

export interface ReconciliationEvidenceProps {
  reconciliation?: ReconciliationResult | null;
}

export function ReconciliationEvidence({ reconciliation }: ReconciliationEvidenceProps) {
  if (!reconciliation) return null;
  const exceptionItems = reconciliation.items
    ? reconciliation.items.filter((item) => item.outcome && item.outcome !== 'MATCHED')
    : (reconciliation.exceptions ?? []);
  return (
    <section className="reconciliation-evidence">
      <h2>Reconciliation result</h2>
      <p>
        <strong>{reconciliation.status?.replaceAll('_', ' ')}</strong>
      </p>
      <dl>
        <div>
          <dt>Scope</dt>
          <dd>{reconciliation.scope}</dd>
        </div>
        <div>
          <dt>Period</dt>
          <dd>
            {new Date(reconciliation.periodStart).toLocaleDateString('en-KE')} –{' '}
            {new Date(reconciliation.periodEnd).toLocaleDateString('en-KE')}
          </dd>
        </div>
        {reconciliation.matchedCount !== undefined && (
          <div>
            <dt>Matched / Exceptions</dt>
            <dd>
              {reconciliation.matchedCount} matched · {reconciliation.exceptionCount ?? exceptionItems.length} exception(s)
            </dd>
          </div>
        )}
      </dl>
      {exceptionItems.length ? (
        <ul>
          {exceptionItems.map((item) => (
            <li key={item.id}>
              {item.providerReference ?? item.sourceId ?? item.id}: {item.outcome ?? item.type}
            </li>
          ))}
        </ul>
      ) : (
        <p>No exceptions were recorded.</p>
      )}
    </section>
  );
}
