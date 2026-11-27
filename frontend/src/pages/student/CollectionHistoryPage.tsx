import { useEffect, useState } from 'react';
import { goodsCollectionApi } from '../../features/goodsCollection/services/goodsCollection.api';
import {
  CollectionConfirmation,
  type GoodsCollectionRecord,
} from '../../features/goodsCollection/components/CollectionConfirmation';
import { getErrorMessage } from '../../services/errorMapper';

export function CollectionHistoryPage() {
  const [items, setItems] = useState<Array<GoodsCollectionRecord & Record<string, any>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    goodsCollectionApi
      .mine()
      .then(({ items: value }) => setItems(value ?? []))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Unable to load collection history.'))
      );
  }, []);

  return (
    <main className="portal-page collection-history-page">
      <p className="section-kicker">Collection history</p>
      <h1>Your goods handovers.</h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {items.length ? (
        <div className="collection-history-list">
          {items.map((collection) => (
            <CollectionConfirmation key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="muted">No goods collection has been recorded for this account.</p>
      )}
    </main>
  );
}
