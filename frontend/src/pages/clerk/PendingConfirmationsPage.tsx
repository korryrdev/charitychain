import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface PendingPhysicalDonation {
  id: string;
  donorName: string;
  kind: string;
  status: string;
  lines: { id: string }[];
}

export function PendingConfirmationsPage() {
  const [items, setItems] = useState<PendingPhysicalDonation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inventoryApi
      .physicalDonations({ pageSize: 50 })
      .then(({ items: value }) => setItems((value ?? []) as PendingPhysicalDonation[]))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Failed to load pending confirmations.'))
      );
  }, []);

  const groups: Record<string, PendingPhysicalDonation[]> = {
    AWAITING_DONOR_CONFIRMATION: items.filter(
      (item) => item.status === 'AWAITING_DONOR_CONFIRMATION'
    ),
    CONFIRMED: items.filter((item) => ['CONFIRMED', 'INSPECTION'].includes(item.status)),
    DEPOSIT_PENDING: items.filter((item) => item.status === 'DEPOSIT_PENDING')
  };

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Donation workflow queue</p>
      <h1>Confirmations and inspection.</h1>
      {error && <p className="form-error">{error}</p>}
      {Object.entries(groups).map(([status, donations]) => (
        <section className="workflow-queue" key={status}>
          <h2>{status.replaceAll('_', ' ')}</h2>
          {donations.length ? (
            donations.map((donation) => (
              <Link key={donation.id} to={`/clerk/inspect/${donation.id}`}>
                <strong>{donation.donorName}</strong>
                <span>
                  {donation.kind} · {donation.lines.length} line(s)
                </span>
                <small>{donation.status.replaceAll('_', ' ')}</small>
              </Link>
            ))
          ) : (
            <p className="muted">No entries in this state.</p>
          )}
        </section>
      ))}
    </main>
  );
}
