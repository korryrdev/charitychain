import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { goodsCollectionApi } from '../../features/goodsCollection/services/goodsCollection.api';
import {
  GoodsSelector,
  type GoodsSelectedLine,
  type GoodsStockItem,
} from '../../features/goodsCollection/components/GoodsSelector';
import type { GoodsAllowanceEligibility } from '../../features/goodsCollection/components/AllowanceSummary';
import {
  validateGoodsSelection,
  type GoodsSelectionPolicy,
} from '../../features/goodsCollection/validation/goodsCollection.schema';
import { getErrorMessage } from '../../services/errorMapper';

interface GoodsRequestOverview {
  policy: GoodsSelectionPolicy;
  eligibility: GoodsAllowanceEligibility;
  stock: GoodsStockItem[];
  [key: string]: any;
}

export function GoodsRequestPage() {
  const [overview, setOverview] = useState<GoodsRequestOverview | null>(null);
  const [selected, setSelected] = useState<GoodsSelectedLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    goodsCollectionApi
      .overview()
      .then((value) => setOverview(value as GoodsRequestOverview))
      .catch((cause: unknown) =>
        setError(getErrorMessage(cause, 'Unable to load available goods.'))
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
        <p className="loading-state">Loading available goods…</p>
      </main>
    );
  }

  const prepare = () => {
    const next = validateGoodsSelection(selected, overview.policy);
    setErrors(next);
    if (!Object.keys(next).length) setPrepared(true);
  };

  return (
    <main className="portal-page goods-request-page">
      <p className="section-kicker">Goods request</p>
      <h1>Choose items for clerk verification.</h1>
      {!overview.eligibility.eligible ? (
        <section className="vetting-pending">
          <h2>Not currently eligible</h2>
          <p>{overview.eligibility.reason}</p>
          <Link className="secondary-button" to="/student/goods">
            Back to goods support
          </Link>
        </section>
      ) : !prepared ? (
        <>
          <GoodsSelector
            stock={overview.stock}
            selected={selected}
            onChange={setSelected}
            policy={overview.policy}
          />
          {errors.lines && (
            <p className="form-error" role="alert">
              {errors.lines}
            </p>
          )}
          {Object.entries(errors)
            .filter(([key]) => key !== 'lines')
            .map(([key, value]) => (
              <p className="form-error" key={key}>
                {value}
              </p>
            ))}
          <button className="primary-button" type="button" onClick={prepare}>
            Prepare selection for the desk
          </button>
        </>
      ) : (
        <section className="portal-card goods-request-summary">
          <h2>Selection prepared</h2>
          <p>
            Bring this summary to the collection desk. It does not reserve stock. The clerk will create an independent record based on items actually available, then CharityChain will send an SMS for your Yes/No confirmation.
          </p>
          <ul>
            {selected.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.quantity} {item.unit}
                </strong>{' '}
                {item.itemName} <span>({item.category.name})</span>
              </li>
            ))}
          </ul>
          <div>
            <button className="secondary-button" type="button" onClick={() => setPrepared(false)}>
              Edit selection
            </button>
            <Link className="primary-button" to="/student/goods">
              Back to goods support
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
