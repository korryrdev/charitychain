import { useEffect, useState } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface CashDeposit {
  id: string;
  depositReference: string;
  amount: string | number;
}

interface PhysicalDonationReconciliation {
  id: string;
  donorName: string;
  status: string;
  cashDeposits: CashDeposit[];
}

export function DailyReconciliationPage() {
  const [items, setItems] = useState<PhysicalDonationReconciliation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inventoryApi
      .physicalDonations({ status: 'DEPOSIT_PENDING', pageSize: 100 })
      .then(({ items: value }) => setItems((value ?? []) as PhysicalDonationReconciliation[]))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Failed to load pending cash receipts.'))
      );
  }, []);

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Daily reconciliation</p>
      <h1>Cash receipts awaiting deposit match.</h1>
      <p className="portal-page__lead">
        A cash handover is not treated as reconciled until its confirmed receipt and deposit
        reference are matched by the authorized reconciliation workflow.
      </p>
      {error && <p className="form-error">{error}</p>}
      {items.length ? (
        <div className="reconciliation-list">
          {items.map((donation) => (
            <article key={donation.id}>
              <strong>{donation.donorName}</strong>
              <span>
                {donation.cashDeposits.length
                  ? donation.cashDeposits
                      .map((deposit) => `${deposit.depositReference} · KES ${deposit.amount}`)
                      .join(', ')
                  : 'No deposit reference recorded'}
              </span>
              <small>{donation.status.replaceAll('_', ' ')}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No confirmed cash receipts are awaiting reconciliation.</p>
      )}
    </main>
  );
}
