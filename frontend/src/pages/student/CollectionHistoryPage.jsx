import { useEffect, useState } from 'react';
import { goodsCollectionApi } from '../../features/goodsCollection/services/goodsCollection.api.js';
import { CollectionConfirmation } from '../../features/goodsCollection/components/CollectionConfirmation.jsx';

export function CollectionHistoryPage() { const [items, setItems] = useState([]); const [error, setError] = useState(null); useEffect(() => { goodsCollectionApi.mine().then(({ items: value }) => setItems(value ?? [])).catch((cause) => setError(cause.message)); }, []); return <main className="portal-page collection-history-page"><p className="section-kicker">Collection history</p><h1>Your goods handovers.</h1>{error && <p className="form-error" role="alert">{error}</p>}{items.length ? <div className="collection-history-list">{items.map((collection) => <CollectionConfirmation key={collection.id} collection={collection} />)}</div> : <p className="muted">No goods collection has been recorded for this account.</p>}</main>; }
