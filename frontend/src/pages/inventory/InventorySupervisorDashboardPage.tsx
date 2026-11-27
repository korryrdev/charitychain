import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface InventoryBatchSummary {
  availableQuantity?: number | string;
  available?: number | string;
  reservedQuantity?: number | string;
  reserved?: number | string;
}

interface InventoryTotals {
  batches: number;
  available: number;
  reserved: number;
}

export function InventorySupervisorDashboardPage() {
  const [items, setItems] = useState<InventoryBatchSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    inventoryApi
      .list({ pageSize: 100 })
      .then((result) => setItems((result.items ?? []) as InventoryBatchSummary[]))
      .catch((cause: unknown) => setError(getErrorMessage(cause, 'Failed to load inventory summary.')));
  }, []);
  const totals = useMemo<InventoryTotals>(
    () =>
      items.reduce<InventoryTotals>(
        (summary, item) => ({
          batches: summary.batches + 1,
          available: summary.available + Number(item.availableQuantity ?? item.available ?? 0),
          reserved: summary.reserved + Number(item.reservedQuantity ?? item.reserved ?? 0)
        }),
        { batches: 0, available: 0, reserved: 0 }
      ),
    [items]
  );
  return <main className="portal-page clerk-page"><p className="section-kicker">Inventory supervision</p><h1>Stock integrity and accountable adjustments.</h1><p className="portal-page__lead">Review accepted stock, reservations, expiry risk, and variances. Every adjustment needs a reason and remains in the audit record.</p>{error && <p className="form-error">{error}</p>}<section className="admin-metric-grid"><article><span>Stock batches</span><strong>{totals.batches}</strong></article><article><span>Available units</span><strong>{totals.available}</strong></article><article><span>Reserved units</span><strong>{totals.reserved}</strong></article></section><section className="portal-card"><h2>Operational controls</h2><p>Only donor-confirmed and inspection-accepted goods become available. This role cannot alter a donor confirmation, student eligibility, or collection confirmation.</p><Link className="primary-button" to="/inventory/stock">Review stock and record an adjustment</Link></section></main>;
}
