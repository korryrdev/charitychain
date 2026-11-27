import { useState, type FormEvent } from 'react';
import { disbursementsApi } from '../../features/disbursements/services/disbursements.api';
import {
  ReconciliationEvidence,
  type ReconciliationResult
} from '../../features/disbursements/components/ReconciliationEvidence';
import { getErrorMessage } from '../../services/errorMapper';

interface ReconciliationFormValues {
  scope: string;
  periodStart: string;
  periodEnd: string;
}

export function ReconciliationPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<ReconciliationFormValues>({
    scope: 'DISBURSEMENTS',
    periodStart: today,
    periodEnd: today
  });
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const requestedEndMs = new Date(`${values.periodEnd}T23:59:59.999Z`).getTime();
      const boundedEnd = new Date(Math.min(requestedEndMs, Date.now())).toISOString();
      const { reconciliation } = await disbursementsApi.reconcile({
        ...values,
        periodStart: new Date(`${values.periodStart}T00:00:00.000Z`).toISOString(),
        periodEnd: boundedEnd
      });
      setResult(reconciliation as ReconciliationResult);
      setError(null);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to run reconciliation.'));
    }
  };

  return (
    <main className="portal-page finance-page">
      <p className="section-kicker">Reconciliation</p>
      <h1>Compare internal records to provider evidence.</h1>
      <form className="reconciliation-form" onSubmit={run}>
        <label>
          Scope
          <select
            value={values.scope}
            onChange={(event) => setValues({ ...values, scope: event.target.value })}
          >
            <option value="DISBURSEMENTS">Disbursements</option>
            <option value="DONATIONS">Donations</option>
            <option value="ALL">All</option>
          </select>
        </label>
        <label>
          Period start
          <input
            type="date"
            value={values.periodStart}
            onChange={(event) => setValues({ ...values, periodStart: event.target.value })}
            required
          />
        </label>
        <label>
          Period end
          <input
            type="date"
            value={values.periodEnd}
            onChange={(event) => setValues({ ...values, periodEnd: event.target.value })}
            required
          />
        </label>
        <button className="primary-button">Run reconciliation</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <ReconciliationEvidence reconciliation={result} />
    </main>
  );
}
