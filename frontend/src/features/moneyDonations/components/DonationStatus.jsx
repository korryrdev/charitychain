import { StatusBadge } from '../../../components/status/StatusBadge.jsx';
const labels = Object.freeze({ CREATED: 'Created', PAYMENT_REQUESTED: 'Payment requested', PROVIDER_PENDING: 'Awaiting provider', CONFIRMED: 'Confirmed', RECONCILED: 'Reconciled', FAILED: 'Failed', REVERSED: 'Reversed' });
export function DonationStatus({ status }) { return <StatusBadge status={status} label={labels[status] ?? status} />; }
