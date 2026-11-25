import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchInput } from '../../components/forms/SearchInput.jsx';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus.jsx';
import { moneyDonationsApi } from '../../features/moneyDonations/services/moneyDonations.api.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const previewDonations = Object.freeze([
  {
    id: 'preview-1',
    createdAt: '2026-11-14T08:30:00.000Z',
    amount: '2500',
    channel: 'MPESA_STK',
    purpose: 'TUITION',
    status: 'RECONCILED',
    trackingId: 'MAL-8R3K2P7Q1Z5X',
    receipt: { receiptNumber: 'MRC-7FA31D4C8B2E9A01' }
  },
  {
    id: 'preview-2',
    createdAt: '2026-11-10T12:15:00.000Z',
    amount: '1000',
    channel: 'MPESA_PAYBILL',
    purpose: 'UNRESTRICTED',
    status: 'CONFIRMED',
    trackingId: 'MAL-6N4V9T2L8C1H',
    receipt: null
  },
  {
    id: 'preview-3',
    createdAt: '2026-11-04T15:40:00.000Z',
    amount: '5000',
    channel: 'BANK',
    purpose: 'UPKEEP',
    status: 'RECONCILED',
    trackingId: 'MAL-1W8D5M3J7Q9F',
    receipt: { receiptNumber: 'MRC-0C6E2A9B4D8F1E73' }
  }
]);

function downloadReceipt(receipt) {
  const content = JSON.stringify(receipt, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${receipt.receiptNumber}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DonationHistoryPage() {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [action, setAction] = useState({ id: null, message: null, error: null });
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150).trim().toLowerCase();

  useEffect(() => {
    let active = true;
    moneyDonationsApi
      .listMine('?pageSize=100')
      .then((response) => active && setState({ loading: false, items: response.items ?? [], error: null }))
      .catch((error) => active && setState({ loading: false, items: [], error: error.message }));
    return () => {
      active = false;
    };
  }, []);

  const download = async (item) => {
    setAction({ id: item.id, message: null, error: null });
    try {
      const { receipt } = await moneyDonationsApi.receipt(item.id);
      downloadReceipt(receipt);
      setAction({ id: null, message: `Receipt ${receipt.receiptNumber} downloaded.`, error: null });
    } catch (error) {
      setAction({ id: null, message: null, error: error.message });
    }
  };

  const verify = async (item) => {
    setAction({ id: item.id, message: null, error: null });
    try {
      const { verification } = await moneyDonationsApi.verifyReceipt(item.id);
      setAction({
        id: null,
        message: verification.valid
          ? `Receipt ${verification.receiptNumber} is valid.`
          : `Receipt ${verification.receiptNumber} is voided or its evidence does not match.`,
        error: verification.valid ? null : 'Receipt verification failed.'
      });
    } catch (error) {
      setAction({ id: null, message: null, error: error.message });
    }
  };

  const isPreview = !state.loading && !state.error && state.items.length === 0;
  const sourceRows = isPreview ? previewDonations : state.items;
  const rows = useMemo(
    () =>
      sourceRows.filter((item) => {
        if (!debouncedQuery) return true;
        return `${item.trackingId ?? ''} ${item.reference ?? ''} ${item.channel ?? ''} ${item.purpose ?? ''} ${item.status ?? ''} ${item.amount ?? ''} ${item.receipt?.receiptNumber ?? ''} ${new Date(item.createdAt).toLocaleDateString()}`
          .toLowerCase()
          .includes(debouncedQuery);
      }),
    [sourceRows, debouncedQuery]
  );

  return (
    <main className="portal-page donor-page donation-history-page">
      <p className="section-kicker">Donation history</p>
      <h1>Your confirmed contribution record.</h1>
      <p className="portal-page__lead">
        Review every money contribution, its current payment state, private tracking ID, and any receipt issued after
        reconciliation.
      </p>
      {state.loading && <p role="status">Loading donations…</p>}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {action.message && (
        <p className="donation-history-feedback" role="status">
          {action.message}
        </p>
      )}
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {!state.loading && !state.error && (
        <>
          {isPreview && (
            <p className="donation-history-preview-note">
              Preview only — these example records show the table layout and are not part of your account.
            </p>
          )}
          <SearchInput
            id="donor-history-search"
            label="Search donations"
            value={query}
            onChange={setQuery}
            placeholder="Search by tracking ID, method, purpose, amount, status, or date…"
          />
          {rows.length ? (
            <div className="donation-history-table-wrap">
              <table className="donation-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment method</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Tracking ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>KES {Number(item.amount).toLocaleString()}</td>
                      <td>{item.channel.replaceAll('_', ' ')}</td>
                      <td>{item.purpose.replaceAll('_', ' ')}</td>
                      <td>
                        <DonationStatus status={item.status} />
                      </td>
                      <td>
                        <code>{item.trackingId}</code>
                      </td>
                      <td>
                        <div className="donation-history-actions">
                          {isPreview ? (
                            <>
                              <button type="button" disabled>
                                Details
                              </button>
                              {item.receipt ? (
                                <>
                                  <button type="button" disabled>
                                    Download receipt
                                  </button>
                                  <button type="button" disabled>
                                    Verify receipt
                                  </button>
                                </>
                              ) : (
                                <span>Receipt pending</span>
                              )}
                            </>
                          ) : (
                            <>
                              <Link to={`/donor/donations/${item.id}`}>Details</Link>
                              {item.receipt ? (
                                <>
                                  <button type="button" disabled={action.id === item.id} onClick={() => download(item)}>
                                    Download receipt
                                  </button>
                                  <button type="button" disabled={action.id === item.id} onClick={() => verify(item)}>
                                    Verify receipt
                                  </button>
                                </>
                              ) : (
                                <span>Receipt pending</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No donations match your search.</p>
          )}
        </>
      )}
    </main>
  );
}
