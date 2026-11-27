import { useEffect, useState } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import {
  InventoryTable,
  type InventoryBatchSummary
} from '../../features/inventory/components/InventoryTable';
import {
  BatchInspector,
  type InventoryBatchDetail
} from '../../features/inventory/components/BatchInspector';
import {
  StockMovementForm,
  type StockMovementAdjustment
} from '../../features/inventory/components/StockMovementForm';
import { StockVarianceAlert } from '../../features/inventory/components/StockVarianceAlert';
import { getErrorMessage } from '../../services/errorMapper';

export function InventoryPage() {
  const [items, setItems] = useState<InventoryBatchSummary[]>([]);
  const [selected, setSelected] = useState<InventoryBatchDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = () =>
    inventoryApi
      .list({ pageSize: 100 })
      .then(({ items: value }) => setItems((value ?? []) as InventoryBatchSummary[]))
      .catch((cause: unknown) =>
        setMessage(getErrorMessage(cause, 'Failed to load inventory batches.'))
      );

  useEffect(() => {
    load();
  }, []);

  const select = async (batch: InventoryBatchSummary) => {
    try {
      setSelected((await inventoryApi.get(batch.id)).batch as InventoryBatchDetail);
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to load batch details.'));
    }
  };

  const adjust = async (payload: StockMovementAdjustment) => {
    if (!selected?.id) return;
    setPending(true);
    try {
      const { batch } = await inventoryApi.adjust(selected.id, { ...payload });
      setSelected(batch as InventoryBatchDetail);
      setMessage('Adjustment recorded with its reason and reference.');
      load();
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to record adjustment.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Inventory control</p>
      <h1>Available, reserved, and expiring stock.</h1>
      <StockVarianceAlert message={message} />
      <div className="inventory-layout">
        <section>
          <InventoryTable items={items} onSelect={select} />
        </section>
        <aside>
          <BatchInspector batch={selected} />
          <StockMovementForm batch={selected} onSubmit={adjust} pending={pending} />
        </aside>
      </div>
    </main>
  );
}
