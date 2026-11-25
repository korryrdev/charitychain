import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { moneyDonationsApi } from '../../features/moneyDonations/services/moneyDonations.api.js';

const money = (amount) => `KES ${Number(amount ?? 0).toLocaleString()}`;

function downloadStatement(items) {
  const statement = {
    generatedAt: new Date().toISOString(),
    scope: 'CharityChain donor contribution statement',
    contributions: items.map(({ trackingId, amount, currency, purpose, status, createdAt, receipt }) => ({ trackingId, amount, currency, purpose, status, createdAt, receiptNumber: receipt?.receiptNumber ?? null, evidenceDigest: receipt?.evidenceDigest ?? null }))
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(statement, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `charitychain-donor-statement-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReceiptsPage() {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  useEffect(() => {
    let active = true;
    moneyDonationsApi.listMine('?pageSize=100')
      .then((response) => active && setState({ loading: false, items: response.items ?? [], error: null }))
      .catch((cause) => active && setState({ loading: false, items: [], error: cause.message }));
    return () => { active = false; };
  }, []);
  const receipts = useMemo(() => state.items.filter((item) => item.receipt), [state.items]);
  return <main className="portal-page donor-page"><p className="section-kicker">Receipts and statements</p><h1>Contribution evidence.</h1><p className="portal-page__lead">A receipt is issued after confirmed and reconciled funds are recorded. Its evidence digest identifies the immutable receipt record; voided receipts remain visible as voided.</p>{state.loading && <p role="status">Loading contribution evidence…</p>}{state.error && <p className="form-error" role="alert">{state.error}</p>}{!state.loading && !state.error && <><div className="portal-action-grid"><button type="button" onClick={() => downloadStatement(state.items)} disabled={!state.items.length}>Download contribution statement</button><Link to="/track">Verify a private tracking record <span>→</span></Link></div><div className="receipt-list">{receipts.length ? receipts.map((item) => <Link to={`/donor/donations/${item.id}`} key={item.id}><strong>{item.receipt.receiptNumber}{item.receipt.voidedAt ? ' · voided' : ''}</strong><span>{money(item.amount)} · {new Date(item.receipt.issuedAt).toLocaleDateString()}</span><small>Evidence digest: {item.receipt.evidenceDigest.slice(0, 16)}…</small></Link>) : <p>Receipts will appear after a donation has been confirmed and reconciled.</p>}</div></>}</main>;
}
