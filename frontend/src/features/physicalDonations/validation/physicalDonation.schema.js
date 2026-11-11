const allowedKinds = new Set(['GOODS', 'CASH', 'MIXED']);

const clean = (value) => String(value ?? '').trim();

export function createDonationLine(type = 'GOODS') {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    name: '',
    category: '',
    quantity: '1',
    unit: 'item',
    declaredValue: ''
  };
}

export function validatePhysicalDonationDeclaration(values) {
  const errors = {};
  const donorName = clean(values.donorName);
  const donorPhone = clean(values.donorPhone).replace(/[\s+-]/g, '');
  const kind = clean(values.kind).toUpperCase();
  const lines = Array.isArray(values.lines) ? values.lines : [];

  if (donorName.length < 2) errors.donorName = 'Enter the donor name.';
  if (!/^254[17]\d{8}$/.test(donorPhone)) errors.donorPhone = 'Use 2547XXXXXXXX or 2541XXXXXXXX.';
  if (!allowedKinds.has(kind)) errors.kind = 'Choose what you are bringing.';
  if (!lines.length) errors.lines = 'Add at least one item or cash amount.';

  const lineErrors = lines.map((line) => {
    const error = {};
    const type = clean(line.type).toUpperCase();
    const quantity = Number(line.quantity);
    if (!['GOODS', 'CASH'].includes(type)) error.type = 'Choose a line type.';
    if (type === 'GOODS' && clean(line.name).length < 2) error.name = 'Name the item.';
    if (!Number.isFinite(quantity) || quantity <= 0) error.quantity = 'Enter a quantity above zero.';
    if (type === 'GOODS' && !clean(line.unit)) error.unit = 'Enter a unit.';
    if (type === 'CASH' && (!Number.isFinite(Number(line.declaredValue)) || Number(line.declaredValue) <= 0)) error.declaredValue = 'Enter the cash amount in KES.';
    return error;
  });

  if (lineErrors.some((line) => Object.keys(line).length)) errors.lineErrors = lineErrors;
  return errors;
}

export function normalisePhysicalDonation(values) {
  return {
    donorName: clean(values.donorName),
    donorPhone: clean(values.donorPhone).replace(/[\s+-]/g, ''),
    kind: clean(values.kind).toUpperCase(),
    lines: values.lines.map((line) => ({
      type: clean(line.type).toUpperCase(),
      name: clean(line.name) || 'Cash donation',
      category: clean(line.category) || undefined,
      quantity: Number(line.quantity),
      unit: clean(line.unit) || 'KES',
      declaredValue: line.declaredValue === '' ? undefined : Number(line.declaredValue)
    }))
  };
}
