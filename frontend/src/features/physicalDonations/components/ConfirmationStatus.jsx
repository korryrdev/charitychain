const messages = {
  DRAFT: ['Draft', 'The clerk has not submitted this receipt for confirmation.'],
  AWAITING_DONOR_CONFIRMATION: ['Awaiting your confirmation', 'Check the SMS and approve only if each item and quantity is correct.'],
  CONFIRMED: ['Confirmed', 'The received goods can now be recognised in inventory.'],
  DEPOSIT_PENDING: ['Cash deposit pending', 'The cash receipt is confirmed and is awaiting matched deposit reconciliation.'],
  REJECTED: ['Correction requested', 'The donor rejected this receipt. The clerk must enter it again.']
};

export function ConfirmationStatus({ status }) {
  const [title, description] = messages[status] ?? ['Not started', 'No confirmation is available yet.'];
  return <aside className={`confirmation-status confirmation-status--${String(status ?? 'UNKNOWN').toLowerCase()}`}><strong>{title}</strong><span>{description}</span></aside>;
}
