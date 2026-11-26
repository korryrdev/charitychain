export interface PayoutSummary {
  status: string;
  type: string;
  amount: number | string;
  failureMessage?: string | null;
}

export interface PayoutStatusProps {
  payout?: PayoutSummary | null;
}

export function PayoutStatus({ payout }: PayoutStatusProps) {
  if (!payout) return null;
  return (
    <section className={`payout-status payout-status--${payout.status.toLowerCase()}`}>
      <strong>{payout.status.replaceAll('_', ' ')}</strong>
      <span>
        {payout.type.replaceAll('_', ' ')} · KES {Number(payout.amount).toLocaleString()}
      </span>
      {payout.failureMessage && <p>{payout.failureMessage}</p>}
    </section>
  );
}
