const steps = ['CREATED', 'PAYMENT_REQUESTED', 'PROVIDER_PENDING', 'CONFIRMED', 'RECONCILED'];
export function DonationTimeline({ donation }) {
  const current = steps.indexOf(donation?.status);
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
