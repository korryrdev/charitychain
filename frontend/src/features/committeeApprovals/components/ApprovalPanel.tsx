import { ApprovalProgress, type ApprovalRound } from './ApprovalProgress';
import { DecisionForm, type DecisionFormValues } from './DecisionForm';

export interface ApprovalPanelProps {
  round?: ApprovalRound | null;
  onDecision: (values: DecisionFormValues) => void | Promise<void>;
  pending?: boolean;
}

export function ApprovalPanel({ round, onDecision, pending = false }: ApprovalPanelProps) {
  return (
    <section className="approval-panel">
      <ApprovalProgress round={round} />
      {round?.status === 'OPEN' && <DecisionForm onSubmit={onDecision} pending={pending} />}
      {round?.decisions?.length ? (
        <div className="approval-history">
          <h3>Signed decisions</h3>
          {round.decisions.map((item) => (
            <article key={item.id}>
              <strong>{item.seat}</strong>
              <span>{item.decision}</span>
              <p>{item.rationale}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
