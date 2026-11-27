import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { approvalsApi } from '../../features/committeeApprovals/services/approvals.api';

interface CommitteeMembership {
  seat: string;
}

interface CommitteeQueueItem {
  id: string;
}

export function CommitteeDashboardPage() {
  const [membership, setMembership] = useState<CommitteeMembership | null>(null);
  const [queue, setQueue] = useState<CommitteeQueueItem[]>([]);

  useEffect(() => {
    approvalsApi
      .me()
      .then(({ membership: value }) => setMembership((value ?? null) as CommitteeMembership | null))
      .catch(() => {});
    approvalsApi
      .queue({ status: 'VERIFIED', pageSize: 10 })
      .then(({ items }) => setQueue((items ?? []) as CommitteeQueueItem[]))
      .catch(() => {});
  }, []);

  return (
    <main className="portal-page committee-page">
      <p className="section-kicker">Committee governance</p>
      <h1>Evidence-led, two-of-three approval.</h1>
      {membership && (
        <p className="committee-seat">
          Current signatory seat: <strong>{membership.seat}</strong>
        </p>
      )}
      <div className="committee-action-grid">
        <Link to="/committee/review">
          Review queue <span>{queue.length}</span>
        </Link>
        <Link to="/committee/cases">Malkia aid cases</Link>
        <Link to="/committee/signing">Web3 2-of-3 signing</Link>
        <Link to="/committee/recognition">Recognition &amp; badge tiers</Link>
        <Link to="/committee/history">Approval history</Link>
        <Link to="/committee/commitments">Funding commitments</Link>
      </div>
      <section className="committee-note">
        <h2>Decision safeguards</h2>
        <p>
          Each decision requires an eligible current signatory, a recorded rationale, and no
          unresolved conflict. Two distinct approvals are required; a material change invalidates
          prior signatures.
        </p>
      </section>
    </main>
  );
}
