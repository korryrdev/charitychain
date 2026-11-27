import { StatusBadge } from '../../../components/status/StatusBadge';

const labels: Readonly<Record<string, string>> = Object.freeze({
  CREATED: 'Created',
  PAYMENT_REQUESTED: 'Payment requested',
  PROVIDER_PENDING: 'Awaiting provider',
  CONFIRMED: 'Confirmed',
  RECONCILED: 'Reconciled',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
});

export interface DonationStatusProps {
  status?: string | null;
}

export function DonationStatus({ status }: DonationStatusProps) {
  return <StatusBadge status={status} label={status ? (labels[status] ?? status) : status} />;
}
