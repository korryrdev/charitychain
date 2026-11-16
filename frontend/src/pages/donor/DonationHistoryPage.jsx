import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchInput } from '../../components/forms/SearchInput.jsx';
import { DonationStatus } from '../../features/moneyDonations/components/DonationStatus.jsx';
import { moneyDonationsApi } from '../../features/moneyDonations/services/moneyDonations.api.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export function DonationHistoryPage() {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150).trim().toLowerCase();

  useEffect(() => {
    let active = true;
    moneyDonationsApi
      .listMine()
      .then((response) => active && setState({ loading: false, items: response.items ?? [], error: null }))
      .catch((error) => active && setState({ loading: false, items: [], error: error.message }));
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(
    () =>
      state.items.filter((item) => {
        if (!debouncedQuery) return true;
        return `${item.trackingId ?? ''} ${item.reference ?? ''} ${item.status ?? ''} ${item.amount ?? ''} ${new Date(item.createdAt).toLocaleDateString()}`
          .toLowerCase()
          .includes(debouncedQuery);
      }),
    [state.items, debouncedQuery]
  );

  return (
    <main className="portal-page donor-page">
      <p className="section-kicker">Donation history</p>
      <h1>Your confirmed contribution record.</h1>
      {state.loading && <p role="status">Loading donations…</p>}
      {state.error && <p role="alert">{state.error}</p>}
      {!state.loading && !state.error && (
        <>
          <SearchInput
            id="donor-history-search"
            label="Search donations"
            value={query}
            onChange={setQuery}
            placeholder="Search by tracking ID, amount, status, or date…"
          />
          <div className="donation-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <Link key={item.id} to={`/donor/donations/${item.id}`}>
                  <div>
                    <strong>KES {Number(item.amount).toLocaleString()}</strong>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <DonationStatus status={item.status} />
                </Link>
              ))
            ) : (
              <p>
                {state.items.length
                  ? 'No donations match your search.'
                  : 'No money donations are recorded yet.'}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
