import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

interface PayoutDetail {
  id: string;
  applicationReference?: string;
  status: string;
  type: string;
  amount: string;
  failureMessage?: string;
  providerRequestId?: string;
  providerTransactionId?: string;
  receiptHash?: string;
  attempts: PayoutAttempt[];
}

export function PayoutDetailPage() {
  const { disbursementId } = useParams<{ disbursementId: string }>();
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!disbursementId) return;
    disbursementsApi
      .get(disbursementId)
      .then(({ disbursement }) => setPayout(disbursement as PayoutDetail))
      .catch((cause: unknown) => setMessage(getErrorMessage(cause, 'Failed to load payout details.')));
  }, [disbursementId]);

  if (!payout) {
    return (
      <main className="portal-page">
        <p className="loading-state">Loading payout…</p>
        {message && <p className="form-error">{message}</p>}
      </main>
    );
  }

  return (
    <main className="portal-page finance-page">
      <p className="section-kicker">Payout detail</p>
      <h1>{payout.applicationReference}</h1>
      <PayoutStatus payout={payout} />
      <PayoutTimeline attempts={payout.attempts} />
      <dl className="payout-evidence">
        <div>
          <dt>Provider request</dt>
          <dd>{payout.providerRequestId ?? '—'}</dd>
        </div>
        <div>
          <dt>Provider transaction</dt>
          <dd>{payout.providerTransactionId ?? '—'}</dd>
        </div>
        <div>
          <dt>Receipt hash</dt>
          <dd>{payout.receiptHash ?? 'Awaiting callback'}</dd>
        </div>
      </dl>
    </main>
  );
}
