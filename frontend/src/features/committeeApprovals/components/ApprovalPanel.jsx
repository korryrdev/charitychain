import { ApprovalProgress } from './ApprovalProgress.jsx';
import { DecisionForm } from './DecisionForm.jsx';
export function ApprovalPanel({ round, onDecision, pending }) { return <section className="approval-panel"><ApprovalProgress round={round} />{round?.status === 'OPEN' && <DecisionForm onSubmit={onDecision} pending={pending} />}{round?.decisions?.length ? <div className="approval-history"><h3>Signed decisions</h3>{round.decisions.map((item) => <article key={item.id}><strong>{item.seat}</strong><span>{item.decision}</span><p>{item.rationale}</p></article>)}</div> : null}</section>; }
