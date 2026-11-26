import { useState, type FormEvent } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface CollectionLine {
  id: string;
  quantity: number;
  unit: string;
  itemName: string;
}

interface GoodsCollection {
  id: string;
  reference: string;
  status: string;
  lines: CollectionLine[];
}

export function StudentCollectionPage() {
  const [id, setId] = useState('');
  const [collection, setCollection] = useState<GoodsCollection | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const find = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setCollection((await inventoryApi.collection(id.trim())).collection as GoodsCollection);
      setMessage(null);
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to find collection.'));
    }
  };

  const release = async () => {
    if (!collection) return;
    try {
      setCollection(
        (await inventoryApi.releaseCollection(collection.id)).collection as GoodsCollection
      );
      setMessage('Goods have been released and recorded.');
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to release goods.'));
    }
  };

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Student collection</p>
      <h1>Release only after student confirmation.</h1>
      <form className="collection-lookup" onSubmit={find}>
        <label>
          Collection ID
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Collection UUID"
            required
          />
        </label>
        <button className="secondary-button">Find collection</button>
      </form>
      {message && <p className="clerk-message">{message}</p>}
      {collection && (
        <section className="portal-card">
          <h2>{collection.reference}</h2>
          <p>
            <strong>{collection.status.replaceAll('_', ' ')}</strong>
          </p>
          <ul>
            {collection.lines.map((line) => (
              <li key={line.id}>
                {line.quantity} {line.unit} {line.itemName}
              </li>
            ))}
          </ul>
          {collection.status === 'CONFIRMED' ? (
            <button className="primary-button" onClick={release}>
              Release confirmed goods
            </button>
          ) : (
            <p className="muted">
              Release remains unavailable until the student has independently confirmed the exact
              items by SMS.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
