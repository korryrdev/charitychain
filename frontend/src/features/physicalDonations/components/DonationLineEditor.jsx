import { createDonationLine } from '../validation/physicalDonation.schema.js';

export function DonationLineEditor({ lines, errors = [], onChange }) {
  const update = (id, field, value) => onChange(lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  const remove = (id) => onChange(lines.filter((line) => line.id !== id));
  const add = (type = 'GOODS') => onChange([...lines, createDonationLine(type)]);

  return (
    <fieldset className="physical-lines">
      <legend>What are you bringing?</legend>
      {lines.map((line, index) => {
        const lineError = errors[index] ?? {};
        const cash = line.type === 'CASH';
        return (
          <section className="physical-line" key={line.id} aria-label={`Donation entry ${index + 1}`}>
            <div className="physical-line__head"><strong>Entry {index + 1}</strong>{lines.length > 1 && <button type="button" className="text-button" onClick={() => remove(line.id)}>Remove</button>}</div>
            <label>Type<select value={line.type} onChange={(event) => update(line.id, 'type', event.target.value)}><option value="GOODS">Physical good</option><option value="CASH">Cash</option></select></label>
            <label>{cash ? 'Description' : 'Item name'}<input value={line.name} placeholder={cash ? 'Cash donation' : 'e.g. Sanitary pads'} onChange={(event) => update(line.id, 'name', event.target.value)} />{lineError.name && <small>{lineError.name}</small>}</label>
            {!cash && <label>Category<input value={line.category} placeholder="e.g. Hygiene" onChange={(event) => update(line.id, 'category', event.target.value)} /></label>}
            <label>Quantity<input type="number" min="1" value={line.quantity} onChange={(event) => update(line.id, 'quantity', event.target.value)} />{lineError.quantity && <small>{lineError.quantity}</small>}</label>
            {!cash && <label>Unit<input value={line.unit} placeholder="item" onChange={(event) => update(line.id, 'unit', event.target.value)} />{lineError.unit && <small>{lineError.unit}</small>}</label>}
            {cash && <label>Amount (KES)<input type="number" min="1" value={line.declaredValue} onChange={(event) => update(line.id, 'declaredValue', event.target.value)} />{lineError.declaredValue && <small>{lineError.declaredValue}</small>}</label>}
          </section>
        );
      })}
      <div className="physical-lines__actions"><button type="button" className="secondary-button" onClick={() => add('GOODS')}>Add an item</button><button type="button" className="secondary-button" onClick={() => add('CASH')}>Add cash</button></div>
    </fieldset>
  );
}
