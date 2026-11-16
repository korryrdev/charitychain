import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/feedback/Alert.jsx';
import { Button } from '../../components/common/Button.jsx';
import { DonationForm } from '../../features/moneyDonations/components/DonationForm.jsx';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus.jsx';
import { DonationTimeline } from '../../features/moneyDonations/components/DonationTimeline.jsx';
import { useDonation } from '../../features/moneyDonations/hooks/useDonation.js';

const pendingPaymentStatuses = new Set(['INITIATED', 'SUBMITTED', 'PENDING']);
const automaticStatusChecks = 24;
const statusCheckIntervalMs = 5_000;

export function DonateMoneyPage() {
  const donation = useDonation();
  const [secretVisible, setSecretVisible] = useState(false);
  const paymentId = donation.payment?.id;
  const paymentStatus = donation.payment?.status;
  const refreshStatus = donation.refreshStatus;

  useEffect(() => {
    if (!paymentId || !pendingPaymentStatuses.has(paymentStatus)) return undefined;
    let active = true;
    let timer;
    let checks = 0;
    const scheduleCheck = () => {
      timer = window.setTimeout(async () => {
        await refreshStatus();
        checks += 1;
        if (active && checks < automaticStatusChecks) scheduleCheck();
      }, statusCheckIntervalMs);
    };
    scheduleCheck();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [paymentId, paymentStatus, refreshStatus]);

  const paymentMessage = {
    PENDING: {
      tone: 'warning',
      title: 'Waiting for M-Pesa confirmation',
      message: 'Confirm the STK prompt on your phone. We are checking the payment status.'
    },
    SUCCEEDED: {
      tone: 'info',
      title: 'Payment confirmed',
      message:
        donation.donation?.status === 'RECONCILED'
          ? 'Your donation has been recorded and cataloged.'
          : 'Your donation is being recorded.'
    },
    FAILED: {
      tone: 'danger',
      title: 'Payment failed',
      message: donation.payment?.responseMessage || 'M-Pesa did not complete the payment.'
    },
    CANCELLED: {
      tone: 'danger',
      title: 'Payment cancelled',
      message: donation.payment?.responseMessage || 'The STK request was cancelled.'
    }
  }[donation.payment?.status];

  return (
    <main className="portal-page donor-page">
      <p className="section-kicker">Money donation</p>
      <h1>Give through a trusted fiat channel.</h1>
      <p className="portal-page__lead">
        CharityChain never asks for a crypto wallet. Payment happens through the selected M-Pesa,
        Paybill, or bank process.
      </p>
      {donation.error && (
        <Alert
          tone="danger"
          title={
            donation.donation ? 'Payment could not be started' : 'Donation could not be started'
          }
        >
          {donation.error}
        </Alert>
      )}
      {!donation.donation && <DonationForm onSubmit={donation.create} pending={donation.pending} />}
      {donation.donation && (
        <section className="donation-created">
          <div>
            <h2>Donation request created</h2>
            <DonationStatus status={donation.donation.status} />
          </div>
          {paymentMessage && (
            <Alert tone={paymentMessage.tone} title={paymentMessage.title}>
              {paymentMessage.message}
            </Alert>
          )}
          {donation.payment && pendingPaymentStatuses.has(donation.payment.status) && (
            <>
              {donation.statusError && (
                <Alert tone="danger" title="Could not check payment status">
                  {donation.statusError}
                </Alert>
              )}
              <Button
                type="button"
                loading={donation.checkingStatus}
                onClick={donation.refreshStatus}
              >
                Check payment status
              </Button>
            </>
          )}
          <DonationTimeline donation={donation.donation} />
          <p>
            Keep these credentials private. You need both to track this donation without signing in.
          </p>
          <dl>
            <dt>Tracking ID</dt>
            <dd>{donation.donation.trackingId}</dd>
            <dt>Verification secret</dt>
            <dd>{secretVisible ? donation.trackingSecret : '••••••••••••••••••••••••••••••••'}</dd>
          </dl>
          <button type="button" onClick={() => setSecretVisible(!secretVisible)}>
            {secretVisible ? 'Hide' : 'Reveal'} verification secret
          </button>
          <p>
            <Link to={`/donor/donations/${donation.donation.id}`}>Open donation details</Link>
          </p>
        </section>
      )}
    </main>
  );
}
