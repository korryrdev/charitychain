const steps = ['CREATED', 'PAYMENT_REQUESTED', 'PROVIDER_PENDING', 'CONFIRMED', 'RECONCILED'];

export interface DonationTimelineProps {
  donation?: { status?: string | null } | null;
}

export function DonationTimeline({ donation }: DonationTimelineProps) {
  const current = donation?.status ? steps.indexOf(donation.status) : -1;
  const failed = donation?.status === 'FAILED';
  return (
    <ol className="donation-timeline" aria-label="Donation progress">
      {steps.map((step, index) => (
        <li key={step} className={index <= current ? 'is-complete' : ''}>
          <span>{index + 1}</span>
          <strong>{step.replaceAll('_', ' ').toLowerCase()}</strong>
        </li>
      ))}
      {failed && (
        <li className="is-failed">
          <span>!</span>
          <strong>payment failed</strong>
        </li>
      )}
    </ol>
  );
}
