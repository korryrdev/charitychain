import { useEffect, useState } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface RejectedDonationLine {
  quantity: number;
  unit: string;
  itemName: string;
}

interface RejectedPhysicalDonation {
  id: string;
  donorName: string;
  kind: string;
  rejectedAt?: string | null;
  lines: RejectedDonationLine[];
}

export function RejectedTransactionsPage() {
  const [items, setItems] = useState<RejectedPhysicalDonation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inventoryApi
      .physicalDonations({ status: 'REJECTED', pageSize: 100 })
      .then(({ items: value }) => setItems((value ?? []) as RejectedPhysicalDonation[]))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Failed to load rejected receipts.'))
      );
  }, []);

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Rejected receipts</p>
      <h1>Correct by re-entering, never by overwriting.</h1>
      <p className="portal-page__lead">
        Donor-rejected records remain in the audit history. If the physical handover still needs to
        be recorded, start a new receipt with the correct details.
      </p>
      {error && <p className="form-error">{error}</p>}
      {items.length ? (
        <div className="rejected-list">
          {items.map((donation) => (
            <article key={donation.id}>
              <strong>{donation.donorName}</strong>
              <span>
                {donation.kind} ·{' '}
                {donation.lines
                  .map((line) => `${line.quantity} ${line.unit} ${line.itemName}`)
                  .join(', ')}
              </span>
              <small>
                Rejected{' '}
                {donation.rejectedAt ? new Date(donation.rejectedAt).toLocaleString('en-KE') : ''}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No rejected physical receipts are currently recorded.</p>
      )}
    </main>
  );
}
