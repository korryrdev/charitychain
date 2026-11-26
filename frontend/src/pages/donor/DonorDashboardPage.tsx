import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { donorIdentityApi } from '../../features/donorIdentity/services/donorIdentity.api';
import { moneyDonationsApi } from '../../features/moneyDonations/services/moneyDonations.api';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus';
import { TierBadge } from '../../features/recognitionTiers/components/TierBadge';
import { getErrorMessage } from '../../services/errorMapper';

const money = (amount: unknown): string => `KES ${Number(amount ?? 0).toLocaleString()}`;

function summary(items: Array<Record<string, any>>) {
  return items.reduce(
    (result, donation) => ({
      confirmed: result.confirmed + (['CONFIRMED', 'RECONCILED'].includes(donation.status) ? Number(donation.amount) : 0),
      active: result.active + (['CREATED', 'PAYMENT_REQUESTED', 'PROVIDER_PENDING'].includes(donation.status) ? 1 : 0),
      receipts: result.receipts + (donation.receipt ? 1 : 0)
    }),
    { confirmed: 0, active: 0, receipts: 0 }
  );
}

export function DonorDashboardPage() {
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [donations, setDonations] = useState<Array<Record<string, any>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([donorIdentityApi.mine(), moneyDonationsApi.listMine('?pageSize=6')])
      .then(([identity, donationResponse]) => {
        if (!active) return;
        setProfile(identity.donor);
        setDonations(donationResponse.items ?? []);
      })
      .catch((cause: unknown) => active && setError(getErrorMessage(cause, 'Unable to load donor dashboard.')));
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => summary(donations), [donations]);

  return <main className="portal-page donor-page">
    <p className="section-kicker">Donor account</p>
    <h1>Make support count.</h1>
    <p className="portal-page__lead">Manage your contributions, private tracking records, receipts, and recognition settings in one donor-only account.</p>
    {error && <p className="form-error" role="alert">{error}</p>}

    <section className="donor-dashboard-grid" aria-label="Donor account summary">
      <article><span>Confirmed contribution value</span><strong>{money(profile?.totalContribution ?? totals.confirmed)}</strong><small>Money and confirmed goods under the approved valuation policy.</small></article>
      <article><span>Recognition tier</span><TierBadge tier={profile?.recognitionTier} /><strong>{profile?.recognitionTier ? 'Progress is calculated from confirmed contributions.' : 'Your first confirmed contribution starts your tier progress.'}</strong></article>
      <article><span>Active tracking records</span><strong>{totals.active}</strong><small>{totals.receipts} verified receipt{totals.receipts === 1 ? '' : 's'} available.</small></article>
    </section>

    <section className="donor-activity" aria-labelledby="recent-donations-heading">
      <div className="section-heading"><div><p className="section-kicker">Private donor record</p><h2 id="recent-donations-heading">Recent contributions</h2></div><Link className="donor-activity__button" to="/donor/donations">View all records</Link></div>
      {donations.length ? <div className="donor-activity__table-wrap"><table className="donor-activity__table"><thead><tr><th>Date</th><th>Amount</th><th>Payment method</th><th>Purpose</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{donations.map((donation) => <tr key={donation.id}><td><Link to={`/donor/donations/${donation.id}`}>{new Date(donation.createdAt).toLocaleDateString()}</Link></td><td>{money(donation.amount)}</td><td>{donation.channel.replaceAll('_', ' ')}</td><td>{donation.purpose.replaceAll('_', ' ')}</td><td><DonationStatus status={donation.status} /></td><td>{donation.receipt ? donation.receipt.receiptNumber : 'Pending'}</td></tr>)}</tbody></table></div> : <p className="muted">Your donation history will appear here after you start a contribution.</p>}
    </section>
  </main>;
}
