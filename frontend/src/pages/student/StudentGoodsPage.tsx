import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { goodsCollectionApi } from '../../features/goodsCollection/services/goodsCollection.api';
import {
  AllowanceSummary,
  type GoodsCollectionOverview,
} from '../../features/goodsCollection/components/AllowanceSummary';
import {
  CollectionConfirmation,
  type GoodsCollectionRecord,
} from '../../features/goodsCollection/components/CollectionConfirmation';
import type { GoodsStockItem } from '../../features/goodsCollection/components/GoodsSelector';
import { getErrorMessage } from '../../services/errorMapper';

type StudentGoodsOverview = GoodsCollectionOverview & {
  stock: GoodsStockItem[];
  [key: string]: any;
};

export function StudentGoodsPage() {
  const [overview, setOverview] = useState<StudentGoodsOverview | null>(null);
  const [collections, setCollections] = useState<
    Array<GoodsCollectionRecord & Record<string, any>>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([goodsCollectionApi.overview(), goodsCollectionApi.mine()])
      .then(([info, history]) => {
        setOverview(info as StudentGoodsOverview);
        setCollections(history.items ?? []);
      })
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Unable to load goods allowance.'))
      );
  }, []);

  if (error) {
    return (
      <main className="portal-page">
        <p className="form-error" role="alert">
          {error}
        </p>
      </main>
    );
  }
  if (!overview) {
    return (
      <main className="portal-page">
        <p className="loading-state">Loading your goods allowance…</p>
      </main>
    );
  }
  const active = collections.find((item) =>
    ['PENDING_CONFIRMATION', 'CONFIRMED'].includes(item.status)
  );
  const stockItems: Array<Record<string, any>> = overview.stock ?? [];

  return (
    <main className="portal-page student-goods-page">
      <p className="section-kicker">Student goods support</p>
      <h1>Collect essentials through a confirmed handover.</h1>
      <p className="portal-page__lead">
        Availability changes in real time. A selection is a request for the clerk to verify, not a stock reservation or a guarantee of collection.
      </p>
      <AllowanceSummary overview={overview} />
      <section className="student-available-goods">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Available goods</p>
            <h2>Current stock at the collection desk</h2>
          </div>
          <span>{stockItems.length} item types available</span>
        </div>
        {stockItems.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemName}</td>
                    <td>{item.category.name}</td>
                    <td>
                      {item.availableQuantity} {item.unit}
                      {item.availableQuantity === 1 ? '' : 's'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">There is no available stock at the moment. Please check again later.</p>
        )}
      </section>
      {overview.eligibility.eligible && !active && (
        <Link className="primary-button" to="/student/goods/request">
          Choose available goods
        </Link>
      )}
      {active && <CollectionConfirmation collection={active} />}
      <section className="goods-next-step">
        <h2>How collection works</h2>
        <ol>
          <li>Choose available items within your allowance.</li>
          <li>At the desk, the clerk checks current stock and records the actual selection.</li>
          <li>Review the handover confirmation independently.</li>
          <li>Only a confirmed entry can be released to you.</li>
        </ol>
      </section>
      <Link className="secondary-button" to="/student/goods/history">
        View collection history
      </Link>
    </main>
  );
}
