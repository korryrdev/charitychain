import { useState, type FormEvent } from 'react';
import { disbursementsApi } from '../../features/disbursements/services/disbursements.api';
import { PayoutStatus } from '../../features/disbursements/components/PayoutStatus';
import { PayoutTimeline } from '../../features/disbursements/components/PayoutTimeline';
import { getErrorMessage } from '../../services/errorMapper';

interface PayoutAttempt {
  id: string;
  sequence: number;
  status: string;
  providerRequestId?: string;
  failureMessage?: string;
}

interface PayoutRecord {
  id: string;
  status: string;
  type: string;
  amount: string;
  failureMessage?: string;
  attempts: PayoutAttempt[];
}

export function ApprovedDisbursementsPage() {
  const [applicationId, setApplicationId] = useState('');
  const [payout, setPayout] = useState<PayoutRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const find = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await disbursementsApi.forApplication(applicationId.trim());
      const disbursement = (response.disbursement ?? null) as PayoutRecord | null;
      setPayout(disbursement);
      setMessage(disbursement ? null : 'No payout exists yet for this approved application.');
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to find payout.'));
    }
  };

  const create = async () => {
    try {
      const { disbursement } = await disbursementsApi.create(
        applicationId.trim(),
        crypto.randomUUID()
      );
      setPayout(disbursement as PayoutRecord);
      setMessage('Payout created from the committee-approved application.');
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to create payout.'));
    }
  };

  return (
    <main className="portal-page finance-page">
      <p className="section-kicker">Disbursements</p>
      <h1>Create or inspect an approved payout.</h1>
      <form className="finance-lookup" onSubmit={find}>
        <label>
          Approved application ID
          <input
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            required
          />
        </label>
        <button className="secondary-button">Find payout</button>
      </form>
      {message && <p className="finance-message">{message}</p>}
      {payout ? (
        <section className="portal-card">
          <PayoutStatus payout={payout} />
          <PayoutTimeline attempts={payout.attempts} />
        </section>
      ) : (
        applicationId && (
          <button className="primary-button" onClick={create}>
            Create payout from approval
          </button>
        )
      )}
    </main>
  );
}
