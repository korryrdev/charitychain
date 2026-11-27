export interface StockMovementRecord {
  id: string;
  type: string;
  quantity: number | string;
  createdAt: string | number | Date;
}

export interface InventoryBatchDetail {
  id?: string;
  item?: { name?: string | null } | null;
  batchNumber?: string | null;
  location?: { name?: string | null } | null;
  receivedQuantity?: number | string | null;
  issuedQuantity?: number | string | null;
  damagedQuantity?: number | string | null;
  status?: string | null;
  movements?: StockMovementRecord[];
}

export interface BatchInspectorProps {
  batch?: InventoryBatchDetail | null;
}

export function BatchInspector({ batch }: BatchInspectorProps) {
  if (!batch) return <p className="muted">Select an inventory batch to inspect it.</p>;
  return (
    <section className="batch-inspector">
      <h2>{batch.item?.name}</h2>
      <dl>
        <div>
          <dt>Batch</dt>
          <dd>{batch.batchNumber}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{batch.location?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{batch.receivedQuantity}</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{batch.issuedQuantity}</dd>
        </div>
        <div>
          <dt>Damaged</dt>
          <dd>{batch.damagedQuantity}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{batch.status}</dd>
        </div>
      </dl>
      {batch.movements?.length ? (
        <>
          <h3>Stock movements</h3>
          <ul>
            {batch.movements.map((movement) => (
              <li key={movement.id}>
                {movement.type} · {movement.quantity} · {new Date(movement.createdAt).toLocaleString('en-KE')}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
