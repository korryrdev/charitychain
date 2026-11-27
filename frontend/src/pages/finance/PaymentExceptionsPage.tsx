import { useState, type FormEvent } from 'react';
import { disbursementsApi } from '../../features/disbursements/services/disbursements.api';
import { PayoutStatus } from '../../features/disbursements/components/PayoutStatus';
import { getErrorMessage } from '../../services/errorMapper';

interface PayoutRecord {
  id: string;
  status: string;
  type: string;
  amount: string;
  failureMessage?: string;
}

export function PaymentExceptionsPage() {
  const [id, setId] = useState('');
  const [payout, setPayout] = useState<PayoutRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const find = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setPayout((await disbursementsApi.get(id.trim())).disbursement as PayoutRecord);
      setMessage(null);
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to inspect payment exception.'));
    }
  };

  const retry = async () => {
    if (!payout) return;
    try {
      setPayout((await disbursementsApi.retry(payout.id)).disbursement as PayoutRecord);
      setMessage('A controlled retry was requested.');
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to retry payout.'));
    }
  };

  return (
    <main className="portal-page finance-page">
      <p className="section-kicker">Payment exceptions</p>
      <h1>Investigate before retrying.</h1>
      <form className="finance-lookup" onSubmit={find}>
        <label>
          Disbursement ID
          <input value={id} onChange={(event) => setId(event.target.value)} required />
        </label>
        <button className="secondary-button">Inspect exception</button>
      </form>
      {message && <p className="finance-message">{message}</p>}
      {payout && (
        <section className="portal-card">
          <PayoutStatus payout={payout} />
          {payout.status === 'FAILED' && (
            <button className="primary-button" onClick={retry}>
              Retry approved payout
            </button>
          )}
          <p className="muted">
            Retries use the original approved amount and destination; they do not change the
            committee decision.
          </p>
        </section>
      )}
    </main>
  );
}
