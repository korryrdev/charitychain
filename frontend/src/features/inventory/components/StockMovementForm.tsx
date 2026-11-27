import { useState, type FormEvent } from 'react';
import type { InventoryBatchDetail } from './BatchInspector';

export type StockMovementAdjustment = {
  quantity: number;
  reason: string;
  referenceId: string;
};

export interface StockMovementFormProps {
  batch?: InventoryBatchDetail | null;
  onSubmit: (values: StockMovementAdjustment) => void | Promise<void>;
  pending?: boolean;
}

export function StockMovementForm({ batch, onSubmit, pending = false }: StockMovementFormProps) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');

  if (!batch) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ quantity: Number(quantity), reason, referenceId });
  };

  return (
    <form className="stock-movement-form" onSubmit={submit}>
      <h3>Record a variance adjustment</h3>
      <p>Adjustments are auditable and never replace a confirmed donor receipt or student collection record.</p>
      <label>
        Quantity change
        <input
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="Use a negative number to reduce stock"
          required
        />
      </label>
      <label>
        Reason
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} required />
      </label>
      <label>
        Reference
        <input value={referenceId} onChange={(event) => setReferenceId(event.target.value)} minLength={4} required />
      </label>
      <button className="secondary-button" disabled={pending}>
        Record adjustment
      </button>
    </form>
  );
}
