'use strict';

export function inventoryVarianceRule({ batches = [] }) {
  return batches.filter((batch) => batch.availableQuantity < 0 || batch.reservedQuantity < 0 || batch.availableQuantity + batch.reservedQuantity + batch.issuedQuantity > batch.receivedQuantity).map((batch) => ({ ruleCode: 'INVENTORY_VARIANCE', severity: 'HIGH', sourceType: 'INVENTORY_BATCH', sourceId: batch.id, title: 'Inventory quantity variance', summary: 'Inventory quantities violate receipt, reservation, and issue conservation.', evidence: { received: batch.receivedQuantity, available: batch.availableQuantity, reserved: batch.reservedQuantity, issued: batch.issuedQuantity } }));
}
