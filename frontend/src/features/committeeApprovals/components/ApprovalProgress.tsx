export interface ApprovalDecisionRecord {
  id: string;
  seat: string;
  decision: string;
  rationale: string;
}

export interface ApprovalRound {
  id?: string;
  sequence: number;
  approvals: number;
  declines: number;
  threshold: number;
  status: string;
  decisions?: ApprovalDecisionRecord[];
}

export interface ApprovalProgressProps {
  round?: ApprovalRound | null;
}

export function ApprovalProgress({ round }: ApprovalProgressProps) {
  if (!round) return <p className="muted">No approval round has been opened.</p>;
  return (
    <section className={`approval-progress approval-progress--${round.status.toLowerCase()}`}>
      <p className="section-kicker">Approval round {round.sequence}</p>
      <h2>
        {round.approvals} of {round.threshold} approvals
      </h2>
      <div className="approval-progress__dots">
        {Array.from({ length: round.threshold }, (_, index) => (
          <span key={index} className={index < round.approvals ? 'is-filled' : ''} />
        ))}
      </div>
      <p>
        {round.status.replaceAll('_', ' ')} · {round.declines} decline{round.declines === 1 ? '' : 's'}
      </p>
    </section>
  );
}
