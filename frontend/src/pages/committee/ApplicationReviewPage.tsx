import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { approvalsApi } from '../../features/committeeApprovals/services/approvals.api';
import { vettingApi } from '../../features/studentVetting/services/vetting.api';
import { ApprovalPanel } from '../../features/committeeApprovals/components/ApprovalPanel';
import { ConflictDeclaration } from '../../features/committeeApprovals/components/ConflictDeclaration';
import { VettingFactors } from '../../features/studentVetting/components/VettingFactors';
import { getErrorMessage } from '../../services/errorMapper';

interface ApplicationHistoryEntry {
  reason?: string | null;
}

interface CommitteeApplication {
  id: string;
  reference: string;
  type: string;
  requestedAmount: string | number;
  status: string;
  financialSnapshot: {
    outstandingBalance: string | number;
  };
  history: ApplicationHistoryEntry[];
}

interface ApprovalDecision {
  id: string;
  seat: string;
  decision: string;
  rationale: string;
}

interface ApprovalRound {
  id: string;
  sequence: number;
  approvals: number;
  declines: number;
  threshold: number;
  status: string;
  decisions?: ApprovalDecision[];
}

interface VettingFactor {
  factor: string;
  outcome: string;
  explanation: string;
  points: string;
  maximumPoints: string;
}

interface VettingRun {
  id: string;
  explanation?: string;
  factors: VettingFactor[];
}

interface CommitteeMembership {
  id: string;
}

interface CommitteeConflict {
  id: string;
  type: string;
  status: string;
}

interface DecisionPayload {
  decision: string;
  rationale: string;
}

interface ConflictPayload {
  membershipId: string;
  type: string;
  description: string;
}

export function ApplicationReviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<CommitteeApplication | null>(null);
  const [round, setRound] = useState<ApprovalRound | null>(null);
  const [run, setRun] = useState<VettingRun | null>(null);
  const [membership, setMembership] = useState<CommitteeMembership | null>(null);
  const [conflicts, setConflicts] = useState<CommitteeConflict[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = async () => {
    if (!applicationId) return;
    try {
      const [{ application: value }, { items: rounds }, { conflicts: items }, { membership: member }] = await Promise.all([
        approvalsApi.application(applicationId),
        approvalsApi.rounds(applicationId),
        approvalsApi.conflicts(applicationId),
        approvalsApi.me()
      ]);
      const typedApplication = value as CommitteeApplication;
      const typedRounds = (rounds ?? []) as ApprovalRound[];
      setApplication(typedApplication);
      setRound(typedRounds.find((item) => item.status === 'OPEN') ?? typedRounds[0] ?? null);
      setConflicts((items ?? []) as CommitteeConflict[]);
      setMembership((member ?? null) as CommitteeMembership | null);
      const id = typedApplication.history
        .find((entry) => entry.reason?.startsWith('VETTING_RUN:'))
        ?.reason?.split(':')[1];
      if (id) setRun((await vettingApi.run(id)).run as VettingRun);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to load committee case.'));
    }
  };

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    (async () => {
      try {
        const [{ application: value }, { items: rounds }, { conflicts: items }, { membership: member }] = await Promise.all([
          approvalsApi.application(applicationId),
          approvalsApi.rounds(applicationId),
          approvalsApi.conflicts(applicationId),
          approvalsApi.me()
        ]);
        if (!active) return;
        const typedApplication = value as CommitteeApplication;
        const typedRounds = (rounds ?? []) as ApprovalRound[];
        setApplication(typedApplication);
        setRound(typedRounds.find((item) => item.status === 'OPEN') ?? typedRounds[0] ?? null);
        setConflicts((items ?? []) as CommitteeConflict[]);
        setMembership((member ?? null) as CommitteeMembership | null);
        const id = typedApplication.history
          .find((entry) => entry.reason?.startsWith('VETTING_RUN:'))
          ?.reason?.split(':')[1];
        if (id) {
          const vettingRun = (await vettingApi.run(id)).run as VettingRun;
          if (active) setRun(vettingRun);
        }
      } catch (cause: unknown) {
        if (active) setError(getErrorMessage(cause, 'Failed to load committee case.'));
      }
    })();
    return () => {
      active = false;
    };
  }, [applicationId]);

  const open = async () => {
    if (!applicationId) return;
    setPending(true);
    try {
      setRound(
        (
          await approvalsApi.open(applicationId, {
            reason: 'Verified need evidence is ready for committee review.'
          })
        ).round as ApprovalRound
      );
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to open approval round.'));
    } finally {
      setPending(false);
    }
  };

  const decide = async (payload: DecisionPayload) => {
    if (!round) return;
    setPending(true);
    try {
      setRound((await approvalsApi.decide(round.id, { ...payload })).round as ApprovalRound);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to record committee decision.'));
    } finally {
      setPending(false);
    }
  };

  const conflict = async (payload: ConflictPayload) => {
    if (!applicationId) return;
    try {
      await approvalsApi.declareConflict(applicationId, { ...payload });
      await load();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to declare conflict.'));
    }
  };

  if (!application) return <main className="portal-page"><p className="loading-state">Loading committee case…</p>{error && <p className="form-error">{error}</p>}</main>;
  return <main className="portal-page committee-page"><p className="section-kicker">CASE-{application.reference.slice(-8)}</p><h1>{application.type} assistance request</h1><p className="committee-amount">Requested: <strong>KES {Number(application.requestedAmount).toLocaleString()}</strong> · Outstanding balance: <strong>KES {Number(application.financialSnapshot.outstandingBalance).toLocaleString()}</strong></p>{error && <p className="form-error">{error}</p>}<section className="committee-evidence"><h2>Need evidence</h2><p>{run?.explanation ?? 'The verified record and policy outcome are locked to this application version.'}</p>{run && <VettingFactors factors={run.factors} />}</section>{application.status === 'VERIFIED' && !round && <button className="primary-button" disabled={pending} onClick={open}>Open approval round</button>}<ApprovalPanel round={round} onDecision={decide} pending={pending} />{membership && <ConflictDeclaration membershipId={membership.id} conflicts={conflicts} onSubmit={conflict} />}</main>;
}
