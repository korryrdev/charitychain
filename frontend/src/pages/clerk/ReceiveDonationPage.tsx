import { useState, type FormEvent } from 'react';
import { inventoryApi } from '../../features/inventory/services/inventory.api';
import { getErrorMessage } from '../../services/errorMapper';

interface DonationLineDraft {
  id: string;
  lineType: string;
  itemName: string;
  category: string;
  quantity: string;
  unit: string;
  declaredValue: string;
}

interface ReceiveDonationValues {
  donorName: string;
  donorPhone: string;
  kind: string;
  lines: DonationLineDraft[];
}

const blank = (): DonationLineDraft => ({
  id: crypto.randomUUID(),
  lineType: 'GOODS',
  itemName: '',
  category: '',
  quantity: '1',
  unit: 'item',
  declaredValue: ''
});

export function ReceiveDonationPage() {
  const [values, setValues] = useState<ReceiveDonationValues>({
    donorName: '',
    donorPhone: '',
    kind: 'GOODS',
    lines: [blank()]
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const updateLine = <K extends keyof DonationLineDraft>(
    id: string,
    field: K,
    value: DonationLineDraft[K]
  ) =>
    setValues((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const payload = {
        ...values,
        donorPhone: values.donorPhone.replace(/[\s+-]/g, ''),
        lines: values.lines.map(({ id: _id, declaredValue, category, ...line }) => ({
          ...line,
          ...(category.trim() ? { category: category.trim() } : {}),
          quantity: Number(line.quantity),
          ...(declaredValue.trim() ? { declaredValue: Number(declaredValue) } : {})
        }))
      };
      const { donation } = await inventoryApi.recordPhysicalDonation(payload);
      const donationId = String(donation.id);
      await inventoryApi.submitPhysicalDonation(donationId);
      await inventoryApi.requestDonorConfirmation(donationId);
      setMessage(`Receipt ${donationId} was submitted for independent donor confirmation.`);
      setValues({ donorName: '', donorPhone: '', kind: 'GOODS', lines: [blank()] });
    } catch (cause: unknown) {
      setMessage(getErrorMessage(cause, 'Failed to submit physical donation.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="portal-page clerk-page">
      <p className="section-kicker">Physical donation intake</p>
      <h1>Record only what was actually received.</h1>
      <p className="portal-page__lead">
        Submitting sends the donor an independent confirmation request. This receipt cannot enter
        inventory or cash reconciliation until the donor confirms it.
      </p>
      {message && <p className="clerk-message">{message}</p>}
      <form className="clerk-form" onSubmit={submit}>
        <label>
          Donor name
          <input
            value={values.donorName}
            onChange={(event) => setValues({ ...values, donorName: event.target.value })}
            required
          />
        </label>
        <label>
          Donor phone
          <input
            value={values.donorPhone}
            onChange={(event) => setValues({ ...values, donorPhone: event.target.value })}
            placeholder="2547XXXXXXXX"
            required
          />
        </label>
        <label>
          Donation type
          <select
            value={values.kind}
            onChange={(event) => setValues({ ...values, kind: event.target.value })}
          >
            <option value="GOODS">Goods</option>
            <option value="CASH">Cash</option>
            <option value="MIXED">Goods and cash</option>
          </select>
        </label>
        <section className="clerk-lines">
          {values.lines.map((line) => (
            <article key={line.id}>
              <select
                value={line.lineType}
                onChange={(event) => updateLine(line.id, 'lineType', event.target.value)}
              >
                <option value="GOODS">Goods</option>
                <option value="CASH">Cash</option>
              </select>
              <input
                value={line.itemName}
                onChange={(event) => updateLine(line.id, 'itemName', event.target.value)}
                placeholder="Item name"
                required
              />
              <input
                value={line.category}
                onChange={(event) => updateLine(line.id, 'category', event.target.value)}
                placeholder="Category"
              />
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(event) => updateLine(line.id, 'quantity', event.target.value)}
                required
              />
              <input
                value={line.unit}
                onChange={(event) => updateLine(line.id, 'unit', event.target.value)}
                placeholder="Unit"
                required
              />
              {line.lineType === 'CASH' && (
                <input
                  type="number"
                  min="1"
                  value={line.declaredValue}
                  onChange={(event) => updateLine(line.id, 'declaredValue', event.target.value)}
                  placeholder="Amount KES"
                  required
                />
              )}{' '}
              {values.lines.length > 1 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setValues({
                      ...values,
                      lines: values.lines.filter((entry) => entry.id !== line.id)
                    })
                  }
                >
                  Remove
                </button>
              )}
            </article>
          ))}
        </section>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setValues({ ...values, lines: [...values.lines, blank()] })}
        >
          Add line
        </button>
        <button className="primary-button" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit for donor confirmation'}
        </button>
      </form>
    </main>
  );
}
