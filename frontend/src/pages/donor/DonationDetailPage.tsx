import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/feedback/Alert';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus';
import { DonationTimeline } from '../../features/moneyDonations/components/DonationTimeline';
import { moneyDonationsApi } from '../../features/moneyDonations/services/moneyDonations.api';
import { getErrorMessage } from '../../services/errorMapper';

const label = (value: string | null | undefined): string =>
  value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (character: string) => character.toUpperCase())
    : 'Not available';
const dateTime = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString() : 'Not available';

function downloadReceipt(receipt: Record<string, any>) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${receipt.receiptNumber}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function DetailField({ label: name, children }: { label: string; children: ReactNode }) {
  return (
    <div className="donation-detail-field">
      <dt>{name}</dt>
      <dd>{children}</dd>
    </div>
  );
}

interface DonationDetailState {
  loading: boolean;
  donation: Record<string, any> | null;
  error: string | null;
}

interface ReceiptActionState {
  pending: boolean;
  message: string | null;
  error: string | null;
}

export function DonationDetailPage() {
  const { donationId } = useParams();
  const [state, setState] = useState<DonationDetailState>({
    loading: true,
    donation: null,
    error: null,
  });
  const [receiptAction, setReceiptAction] = useState<ReceiptActionState>({
    pending: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    if (!donationId) return;
    let active = true;
    moneyDonationsApi
      .get(donationId)
      .then(
        (response) =>
          active && setState({ loading: false, donation: response.donation, error: null })
      )
      .catch(
        (error: unknown) =>
          active &&
          setState({
            loading: false,
            donation: null,
            error: getErrorMessage(error, 'Unable to load donation details.'),
          })
      );
    return () => {
      active = false;
    };
  }, [donationId]);

  const download = async () => {
    if (!donationId) return;
    setReceiptAction({ pending: true, message: null, error: null });
    try {
      const { receipt } = await moneyDonationsApi.receipt(donationId);
      downloadReceipt(receipt);
      setReceiptAction({
        pending: false,
        message: `Receipt ${receipt.receiptNumber} downloaded.`,
        error: null,
      });
    } catch (error: unknown) {
      setReceiptAction({
        pending: false,
        message: null,
        error: getErrorMessage(error, 'Unable to download receipt.'),
      });
    }
  };

  const verify = async () => {
    if (!donationId) return;
    setReceiptAction({ pending: true, message: null, error: null });
    try {
      const { verification } = await moneyDonationsApi.verifyReceipt(donationId);
      setReceiptAction({
        pending: false,
        message: verification.valid ? `Receipt ${verification.receiptNumber} is valid.` : null,
        error: verification.valid
          ? null
          : 'This receipt is voided or its evidence does not match.',
      });
    } catch (error: unknown) {
      setReceiptAction({
        pending: false,
        message: null,
        error: getErrorMessage(error, 'Unable to verify receipt.'),
      });
    }
  };

  if (!donationId) {
    return (
      <main className="portal-page">
        <p className="form-error" role="alert">
          Donation identifier is missing.
        </p>
      </main>
    );
  }
  if (state.loading) {
    return (
      <main className="portal-page">
        <p role="status">Loading donation details…</p>
      </main>
    );
  }
  if (state.error || !state.donation) {
    return (
      <main className="portal-page">
        <p className="form-error" role="alert">
          {state.error ?? 'Donation not found.'}
        </p>
      </main>
    );
  }
  const donation = state.donation;
  return (
    <main className="portal-page donor-page donation-detail-page">
      <Link className="donation-detail-page__back" to="/donor/donations">
        Back to contribution records
      </Link>
      <header className="donation-detail-hero">
        <div>
          <p className="section-kicker">Donation details</p>
          <h1>Contribution record</h1>
        </div>
        <section className="donation-detail-amount" aria-label="Donation amount">
          <strong>KES {Number(donation.amount).toLocaleString()}</strong>
          <DonationStatus status={donation.status} />
        </section>
      </header>
      <section className="donation-detail-flow" aria-labelledby="donation-flow-heading">
        <h2 id="donation-flow-heading">Status</h2>
        <DonationTimeline donation={donation} />
      </section>
      {donation.status === 'FAILED' && (
        <Alert tone="danger" title={donation.failureTitle || 'Payment failed'}>
          {donation.failureReason ||
            'The payment provider rejected or did not complete this transaction.'}
          {donation.failureCode ? ` (Code: ${donation.failureCode})` : ''}
        </Alert>
      )}
      <div className="donation-detail-grid">
        <section className="donation-detail-card">
          <h2>Payment and tracking</h2>
          <dl>
            <DetailField label="Private tracking ID">
              <code>{donation.trackingId}</code>
            </DetailField>
            <DetailField label="Payment method">{label(donation.channel)}</DetailField>
            <DetailField label="Support purpose">{label(donation.purpose)}</DetailField>
            <DetailField label="Purpose reference">
              {donation.purposeReference ?? 'Central support pool'}
            </DetailField>
            <DetailField label="Provider reference">
              {donation.providerReference ?? 'Awaiting provider reference'}
            </DetailField>
            <DetailField label="Provider receipt">
              {donation.providerReceipt ?? 'Awaiting provider receipt'}
            </DetailField>
          </dl>
        </section>
        <section className="donation-detail-card">
          <h2>Recorded events</h2>
          <dl>
            <DetailField label="Donation created">{dateTime(donation.createdAt)}</DetailField>
            <DetailField label="Provider confirmation">
              {dateTime(donation.confirmedAt)}
            </DetailField>
            <DetailField label="Reconciled">{dateTime(donation.reconciledAt)}</DetailField>
            <DetailField label="Reversed">{dateTime(donation.reversedAt)}</DetailField>
          </dl>
        </section>
      </div>
      <div className="donation-detail-grid donation-detail-grid--lower">
        <section className="donation-detail-card">
          <h2>Allocation and reconciliation</h2>
          {donation.allocations.length ? (
            <ul className="donation-allocation-list">
              {(donation.allocations as Array<Record<string, any>>).map((allocation) => (
                <li key={allocation.id}>
                  <div>
                    <strong>{label(allocation.allocationType)}</strong>
                    <span>{allocation.targetReference}</span>
                  </div>
                  <div>
                    <strong>KES {Number(allocation.amount).toLocaleString()}</strong>
                    <span>{label(allocation.status)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              This contribution has not yet been allocated. Allocation begins after confirmed provider payment and reconciliation.
            </p>
          )}
        </section>
        <section className="donation-detail-card donation-receipt-card">
          <h2>Receipt and evidence</h2>
          {donation.receipt ? (
            <>
              <dl>
                <DetailField label="Receipt number">
                  <code>{donation.receipt.receiptNumber}</code>
                </DetailField>
                <DetailField label="Issued">{dateTime(donation.receipt.issuedAt)}</DetailField>
                <DetailField label="Evidence digest">
                  <code>{donation.receipt.evidenceDigest}</code>
                </DetailField>
                <DetailField label="Receipt status">
                  {donation.receipt.voidedAt
                    ? `Voided ${dateTime(donation.receipt.voidedAt)}`
                    : 'Active'}
                </DetailField>
              </dl>
              <div className="donation-receipt-card__actions">
                <button type="button" disabled={receiptAction.pending} onClick={download}>
                  Download receipt
                </button>
                <button type="button" disabled={receiptAction.pending} onClick={verify}>
                  Verify evidence
                </button>
              </div>
            </>
          ) : (
            <p>
              A receipt becomes available only after this donation is reconciled. Until then, use the private tracking ID above to follow the payment state.
            </p>
          )}
          {receiptAction.message && (
            <p className="donation-history-feedback" role="status">
              {receiptAction.message}
            </p>
          )}
          {receiptAction.error && (
            <p className="form-error" role="alert">
              {receiptAction.error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
