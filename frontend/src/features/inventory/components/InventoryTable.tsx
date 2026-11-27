export interface InventoryItemCategory {
  name: string;
}

export interface InventoryItemInfo {
  name: string;
  unit?: string | null;
  category?: InventoryItemCategory | null;
}

export interface InventoryBatchSummary {
  id: string;
  item?: InventoryItemInfo | null;
  availableQuantity: number | string;
  reservedQuantity: number | string;
  expiresAt?: string | number | Date | null;
  status: string;
}

export interface InventoryTableProps {
  items?: InventoryBatchSummary[];
  onSelect?: (batch: InventoryBatchSummary) => void;
}

export function InventoryTable({ items = [], onSelect }: InventoryTableProps) {
  if (!items.length) return <p className="muted">No inventory batches match this view.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Available</th>
            <th>Reserved</th>
            <th>Expiry</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((batch) => (
            <tr
              key={batch.id}
              onClick={() => onSelect?.(batch)}
              className={onSelect ? 'is-clickable' : ''}
            >
              <td>{batch.item?.name}</td>
              <td>{batch.item?.category?.name}</td>
              <td>
                {batch.availableQuantity} {batch.item?.unit}
              </td>
              <td>{batch.reservedQuantity}</td>
              <td>{batch.expiresAt ? new Date(batch.expiresAt).toLocaleDateString('en-KE') : '—'}</td>
              <td>{batch.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
