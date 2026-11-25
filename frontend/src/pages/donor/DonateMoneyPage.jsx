import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/feedback/Alert.jsx';
import { DonationForm } from '../../features/moneyDonations/components/DonationForm.jsx';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus.jsx';
import { DonationTimeline } from '../../features/moneyDonations/components/DonationTimeline.jsx';
import { useDonation } from '../../features/moneyDonations/hooks/useDonation.js';

export function DonateMoneyPage() {
  const donation = useDonation();
  const [secretVisible, setSecretVisible] = useState(false);

  if (donation.donation) return <main className="portal-page donor-page donation-page">
    <p className="section-kicker">Donation request created</p><h1>Your tracking record is ready.</h1><p className="portal-page__lead">Complete the selected provider payment next. CharityChain only treats your contribution as confirmed after the provider response is reconciled.</p>
    <section className="donation-success-card"><header><div><span>Private tracking record</span><h2>{donation.donation.trackingId}</h2></div><DonationStatus status={donation.donation.status} /></header><DonationTimeline donation={donation.donation} /><div className="donation-success-card__credentials"><div><span>Verification secret</span><strong>{secretVisible ? donation.trackingSecret : '••••••••••••••••••••••••••••••••'}</strong><button type="button" onClick={() => setSecretVisible((current) => !current)}>{secretVisible ? 'Hide secret' : 'Reveal secret'}</button></div><aside><strong>Keep this private</strong><p>The tracking ID and secret can be used to check this donation without signing in.</p></aside></div><footer><Link className="primary-button" to={`/donor/donations/${donation.donation.id}`}>Open donation details</Link><Link className="secondary-button" to="/donor">Return to dashboard</Link></footer></section>
  </main>;

  return <main className="portal-page donor-page donation-page">
    <div className="donation-page__intro"><div className="donation-page__copy"><h1>Support students with a traceable contribution.</h1><p className="portal-page__lead">Choose an amount, payment channel, and purpose. Actual payment stays with M-Pesa, Paybill, or your bank—never cryptocurrency.</p></div></div>
    {donation.error && <Alert tone="danger" title="Donation could not be started">{donation.error}</Alert>}
    <div className="donation-flow"><section className="donation-flow__form"><DonationForm onSubmit={donation.create} pending={donation.pending} /></section><aside className="donation-flow__aside"><div className="donation-flow__trust"><span>Protected flow</span><strong>Every confirmed contribution receives a private tracking record.</strong></div><p className="section-kicker">What happens next</p><ol><li><span>1</span><div><strong>We create your tracking record</strong><p>It is private and linked to this request.</p></div></li><li><span>2</span><div><strong>You complete provider authorization</strong><p>Confirm the M-Pesa prompt, Paybill payment, or bank transfer.</p></div></li><li><span>3</span><div><strong>The contribution is confirmed</strong><p>Provider evidence is reconciled before any public impact is reported.</p></div></li></ol><div className="donation-flow__note"><strong>No crypto. No wallets.</strong><p>CharityChain records a tamper-evident audit trail while money moves only through approved fiat channels.</p></div></aside></div>
  </main>;
}
