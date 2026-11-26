import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface PhysicalDonationLine {
  id: string;
  lineType: string;
  itemName: string;
  quantity: number;
  unit: string;
}

interface PhysicalDonationDetail {
  id: string;
  status: string;
  lines: PhysicalDonationLine[];
}

export function InspectGoodsPage() {
  const { donationId } = useParams<{ donationId: string }>();
  const [donation, setDonation] = useState<PhysicalDonationDetail | null>(null);
  const [decision, setDecision] = useState('ACCEPTED');
  const [quantities, setQuantities] = useState<Record<string, number | string>>({});
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!donationId) return;
    inventoryApi
      .physicalDonation(donationId)
      .then(({ donation: value }) => {
        const typedDonation = value as PhysicalDonationDetail;
        setDonation(typedDonation);
        setQuantities(
          Object.fromEntries(
            typedDonation.lines
              .filter((line) => line.lineType === 'GOODS')
              .map((line) => [line.id, line.quantity])
          )
        );
      })
      .catch((cause: unknown) =>
        setMessage(getErrorMessage(cause, 'Failed to load physical donation.'))
      );
  }, [donationId]);

  const inspect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!donationId || !donation) return;
    try {
      const { donation: updated } = await inventoryApi.inspect(donationId, {
        decision,
        notes,
        lines: donation.lines
          .filter((line) => line.lineType === 'GOODS')
          .map((line) => ({
            lineId: line.id,
            acceptedQuantity: Number(quantities[line.id] ?? 0),
            ...(decision !== 'ACCEPTED' ? { rejectionReason: notes || 'Inspection adjustment' } : {})
          }))
      });
      const typedUpdated = updated as PhysicalDonationDetail;
      setDonation(typedUpdated);
      setMessage(`Inspection recorded: ${typedUpdated.status.replaceAll('_', ' ')}.`);
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to record inspection.'));
    }
  };

  if (!donation) {
    return (
      <main className="portal-page">
        <p className="loading-state">Loading donation…</p>
        {message && <p className="form-error">{message}</p>}
      </main>
    );
  }

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Goods inspection</p>
      <h1>Inspect confirmed receipt.</h1>
      <p>
        This step evaluates physical condition and count; it cannot change the donor’s confirmation
        record.
      </p>
      {message && <p className="clerk-message">{message}</p>}
      <form className="inspection-form" onSubmit={inspect}>
        <label>
          Decision
          <select value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="ACCEPTED">Accept</option>
            <option value="PARTIALLY_ACCEPTED">Partially accept</option>
            <option value="DECLINED">Decline</option>
          </select>
        </label>
        {donation.lines
          .filter((line) => line.lineType === 'GOODS')
          .map((line) => (
            <label key={line.id}>
              {line.itemName} ({line.quantity} {line.unit} declared)
              <input
                type="number"
                min="0"
                max={line.quantity}
                value={quantities[line.id] ?? 0}
                onChange={(event) =>
                  setQuantities({ ...quantities, [line.id]: event.target.value })
                }
              />
            </label>
          ))}
        <label>
          Inspection notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="primary-button">Record inspection</button>
      </form>
    </main>
  );
}
