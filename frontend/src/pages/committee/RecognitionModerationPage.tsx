import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/features/authentication/hooks/useSession';
import { hasPermission } from '@/features/authorization/permissions';
import { getErrorMessage } from '@/services/errorMapper';
import type {
  BadgeTierProposal,
  BadgeTierThresholdConfig,
  RecognitionModerationEntry,
  RecognitionReportAlert,
} from '@/types';
import { Award, CheckCircle2, Flag, RefreshCw, ShieldAlert } from 'lucide-react';

type ActiveTab = 'MODERATION' | 'TIERS';

export function RecognitionModerationPage() {
  const { session, user } = useSession();
  const canModerate = hasPermission(session, 'recognition:moderate');
  const canManageTiers = hasPermission(session, 'badge-tier:manage');

  const [tab, setTab] = useState<ActiveTab>(canModerate ? 'MODERATION' : 'TIERS');
  const [entries, setEntries] = useState<RecognitionModerationEntry[]>([]);
  const [openReports, setOpenReports] = useState<RecognitionReportAlert[]>([]);
  const [thresholds, setThresholds] = useState<BadgeTierThresholdConfig[]>([]);
  const [proposals, setProposals] = useState<BadgeTierProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [takedownTarget, setTakedownTarget] = useState<RecognitionModerationEntry | null>(null);
  const [takedownReason, setTakedownReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [proposeTier, setProposeTier] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'PATRON'>('BRONZE');
  const [proposeKes, setProposeKes] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      canModerate
        ? api.getRecognitionModeration()
        : Promise.resolve({ entries: [], openReports: [] }),
      api.getBadgeTierGovernance().catch(() => ({ thresholds: [], proposals: [] })),
    ])
      .then(([modData, tierData]) => {
        if (!active) return;
        setEntries(modData.entries ?? []);
        setOpenReports(modData.openReports ?? []);
        setThresholds(tierData.thresholds ?? []);
        setProposals(tierData.proposals ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Failed to load recognition governance data.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canModerate, reloadKey]);

  const handleTakedownSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!takedownTarget) return;
    if (takedownReason.trim().length < 5) {
      setError('A takedown reason of at least 5 characters is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await api.takedownRecognitionName(takedownTarget.id, takedownReason.trim());
      setFeedback(
        `Removed "${takedownTarget.displayName}" from public view and reverted donor to anonymous.`
      );
      setTakedownTarget(null);
      setTakedownReason('');
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to take down public recognition name.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const kesValue = Number(proposeKes);
    if (!Number.isFinite(kesValue) || kesValue <= 0) {
      setError('Enter a valid positive threshold in KES.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await api.proposeBadgeTierChange(proposeTier, kesValue);
      setFeedback(
        `Proposed KES ${kesValue.toLocaleString()} for ${proposeTier}. A second committee member must approve before activation.`
      );
      setProposeKes('');
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to propose badge tier change.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveProposal = async (tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PATRON') => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await api.approveBadgeTierChange(tier);
      setFeedback(`Second-committee approval recorded for ${tier} badge threshold.`);
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to approve badge tier proposal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecompute = async () => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await api.recomputeDonorBadges();
      setFeedback(
        `Recomputed badges across ${res.donorsProcessed} donor references (${res.totalNewAwards} new awards).`
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to recompute donor badges.'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentUserId = user?.id ?? session?.user?.id ?? null;

  return (
    <main className="portal-page committee-page space-y-6">
      <header className="space-y-2">
        <p className="section-kicker">Recognition governance</p>
        <h1>Moderation &amp; badge-tier governance.</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Review reported public donor display names (FR-DON-16) and govern cumulative recognition thresholds under dual-committee approval (FR-DON-07).
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('MODERATION')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            tab === 'MODERATION'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Public Name Moderation ({openReports.length} open reports)
        </button>
        <button
          type="button"
          onClick={() => setTab('TIERS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            tab === 'TIERS'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Badge Tier Thresholds ({proposals.filter((p) => p.status === 'PENDING_APPROVAL').length} pending)
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {feedback && (
        <div role="status" className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-zinc-500">Loading recognition governance state…</p>
      ) : tab === 'MODERATION' ? (
        <div className="space-y-6">
          <section className="portal-card space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-600" />
              Open public name reports
            </h2>
            {openReports.length === 0 ? (
              <p className="text-xs text-zinc-500">No unresolved visitor name reports.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {openReports.map((rep) => (
                  <li
                    key={rep.id}
                    className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rep.description}</p>
                      <p className="text-zinc-500">
                        Alert {rep.id.slice(0, 8)} · Entry {rep.entityId ?? '—'} · Status: {rep.status}
                      </p>
                    </div>
                    {canModerate && rep.entityId && (
                      <button
                        type="button"
                        onClick={() => {
                          const match = entries.find((entry) => entry.id === rep.entityId);
                          if (match) {
                            setTakedownTarget(match);
                            setTakedownReason('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700"
                      >
                        Review &amp; take down
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {takedownTarget && (
            <section className="portal-card border-rose-300 dark:border-rose-800 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4" />
                Take down public name: {takedownTarget.displayName}
              </h2>
              <form onSubmit={handleTakedownSubmit} className="space-y-3">
                <div>
                  <label htmlFor="takedown-reason" className="block text-xs font-semibold mb-1">
                    Audit reason for takedown (minimum 5 characters)
                  </label>
                  <input
                    id="takedown-reason"
                    type="text"
                    required
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    placeholder="e.g. Impersonates university official or uses abusive wording"
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submitting ? 'Removing…' : 'Confirm takedown (revert to ANONYMOUS)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTakedownTarget(null)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="portal-card space-y-3">
            <h2 className="text-sm font-bold">Opted-in public recognition entries</h2>
            {entries.length === 0 ? (
              <p className="text-xs text-zinc-500">No donors are currently opted in on the public recognition wall.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      <th className="py-2 pr-3">Displayed Name</th>
                      <th className="py-2 pr-3">Mode</th>
                      <th className="py-2 pr-3">Badge</th>
                      <th className="py-2 pr-3">Month</th>
                      <th className="py-2 pr-3">Masked Donor Ref</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-zinc-100 dark:border-zinc-800/70">
                        <td className="py-2.5 pr-3 font-semibold">{entry.displayName}</td>
                        <td className="py-2.5 pr-3">{entry.displayMode}</td>
                        <td className="py-2.5 pr-3">{entry.badge ?? 'Supporter'}</td>
                        <td className="py-2.5 pr-3">{entry.awardedMonth}</td>
                        <td className="py-2.5 pr-3 font-mono">{entry.maskedDonorRef}</td>
                        <td className="py-2.5">
                          {canModerate && (
                            <button
                              type="button"
                              onClick={() => {
                                setTakedownTarget(entry);
                                setTakedownReason('');
                              }}
                              className="text-rose-600 hover:underline font-semibold"
                            >
                              Take down
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="portal-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Active annual KES badge thresholds
              </h2>
              {canManageTiers && (
                <button
                  type="button"
                  onClick={handleRecompute}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recompute badges</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {thresholds.map((item) => (
                <div
                  key={item.tier}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    {item.tier}
                  </span>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                    KES {item.thresholdKes.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {canManageTiers && (
            <section className="portal-card space-y-3">
              <h2 className="text-sm font-bold">Propose threshold change (dual approval required)</h2>
              <form onSubmit={handleProposeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label htmlFor="proposal-tier" className="block text-xs font-semibold mb-1">
                    Badge tier
                  </label>
                  <select
                    id="proposal-tier"
                    value={proposeTier}
                    onChange={(e) =>
                      setProposeTier(e.target.value as 'BRONZE' | 'SILVER' | 'GOLD' | 'PATRON')
                    }
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                  >
                    <option value="BRONZE">BRONZE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PATRON">PATRON</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="proposal-kes" className="block text-xs font-semibold mb-1">
                    Proposed minimum (KES)
                  </label>
                  <input
                    id="proposal-kes"
                    type="number"
                    min="1"
                    required
                    value={proposeKes}
                    onChange={(e) => setProposeKes(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit proposal'}
                </button>
              </form>
            </section>
          )}

          <section className="portal-card space-y-3">
            <h2 className="text-sm font-bold">Threshold proposals &amp; second-member approvals</h2>
            {proposals.length === 0 ? (
              <p className="text-xs text-zinc-500">No pending or historical threshold proposals recorded.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {proposals.map((proposal) => {
                  const isSelfProposal =
                    Boolean(currentUserId) && proposal.proposedByUserId === currentUserId;
                  const isPending = proposal.status === 'PENDING_APPROVAL';
                  return (
                    <div
                      key={proposal.id}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold">
                          {proposal.tier}: KES {proposal.thresholdKes.toLocaleString()} ({proposal.status})
                        </p>
                        <p className="text-zinc-500">
                          Proposed by {proposal.proposedByUserId?.slice(0, 8) ?? '—'} · Cooling target:{' '}
                          {proposal.activatesAt ? new Date(proposal.activatesAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      {isPending && canManageTiers && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            disabled={submitting || isSelfProposal}
                            onClick={() => handleApproveProposal(proposal.tier)}
                            className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold disabled:opacity-40"
                          >
                            Approve (2nd committee member)
                          </button>
                          {isSelfProposal && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">
                              Proposed by you — a different committee member must approve.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
