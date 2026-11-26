export interface PayoutAttempt {
  id: string;
  sequence: number;
  status: string;
  providerRequestId?: string | null;
  failureMessage?: string | null;
}

export interface PayoutTimelineProps {
  attempts?: PayoutAttempt[];
}

export function PayoutTimeline({ attempts = [] }: PayoutTimelineProps) {
  return (
    <ol className="payout-timeline">
      {attempts.map((attempt) => (
        <li key={attempt.id}>
          <strong>
            Attempt {attempt.sequence} · {attempt.status}
          </strong>
          <span>{attempt.providerRequestId ?? attempt.failureMessage ?? 'Awaiting provider response'}</span>
        </li>
      ))}
    </ol>
  );
}
