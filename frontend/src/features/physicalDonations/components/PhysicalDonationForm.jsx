import { useMemo, useState } from 'react';
import { DonationLineEditor } from './DonationLineEditor.jsx';
import { createDonationLine, normalisePhysicalDonation, validatePhysicalDonationDeclaration } from '../validation/physicalDonation.schema.js';

export function PhysicalDonationForm({ defaultName = '', defaultPhone = '', onDeclared }) {
  const initial = useMemo(() => ({ donorName: defaultName, donorPhone: defaultPhone, kind: 'GOODS', lines: [createDonationLine()] }), [defaultName, defaultPhone]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validatePhysicalDonationDeclaration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onDeclared(normalisePhysicalDonation(values));
  };

  return <form className="physical-donation-form" onSubmit={submit} noValidate>
    <div className="form-grid">
      <label>Your name<input value={values.donorName} onChange={(event) => update('donorName', event.target.value)} autoComplete="name" />{errors.donorName && <small>{errors.donorName}</small>}</label>
      <label>Phone for SMS confirmation<input value={values.donorPhone} onChange={(event) => update('donorPhone', event.target.value)} placeholder="2547XXXXXXXX" inputMode="tel" autoComplete="tel" />{errors.donorPhone && <small>{errors.donorPhone}</small>}</label>
      <label>Donation type<select value={values.kind} onChange={(event) => update('kind', event.target.value)}><option value="GOODS">Goods only</option><option value="CASH">Cash only</option><option value="MIXED">Goods and cash</option></select>{errors.kind && <small>{errors.kind}</small>}</label>
    </div>
    <DonationLineEditor lines={values.lines} errors={errors.lineErrors} onChange={(lines) => update('lines', lines)} />
    {errors.lines && <p className="form-error" role="alert">{errors.lines}</p>}
    <button className="primary-button" type="submit">Prepare check-in summary</button>
  </form>;
}
