import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/app/i18n/I18nContext';
import { useSession } from '@/features/authentication/hooks/useSession';
import { hasPermission } from '@/features/authorization/permissions';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/services/errorMapper';
import type { ComplaintRecord } from '@/types';
import { PublicPage } from './PublicPage';
import { CheckCircle2, Scale } from 'lucide-react';

export function ComplaintPage() {
  const { t } = useTranslation();
  const { session, authenticated } = useSession();
  const canCreateAuth = Boolean(authenticated && hasPermission(session, 'complaint:create'));
  const canManage = Boolean(authenticated && hasPermission(session, 'complaint:manage'));

  const [category, setCategory] = useState('DONATION_ISSUE');
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<ComplaintRecord | null>(null);

  const [myComplaints, setMyComplaints] = useState<ComplaintRecord[]>([]);
  const [queue, setQueue] = useState<ComplaintRecord[]>([]);
  const [resolutionTargetId, setResolutionTargetId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadPortals = useCallback(async () => {
    if (canCreateAuth) {
      api
        .getMyComplaints()
        .then((res) => setMyComplaints(res.items ?? []))
        .catch(() => {});
    }
    if (canManage) {
      api
        .listComplaints()
        .then((res) => setQueue(res.items ?? []))
        .catch(() => {});
    }
  }, [canCreateAuth, canManage]);

  useEffect(() => {
    void loadPortals();
  }, [loadPortals]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 15) {
      setError('Description must be at least 15 characters.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const payload = {
        category,
        subject: subject.trim(),
        description: description.trim(),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(reporterContact.trim() ? { reporterContact: reporterContact.trim() } : {}),
      };
      const res = canCreateAuth
        ? await api.submitAuthenticatedComplaint(payload)
        : await api.submitPublicComplaint(payload);
      setSubmitted(res.complaint);
      setSubject('');
      setReference('');
      setDescription('');
      setReporterContact('');
      await loadPortals();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to submit complaint. Please verify the details.'));
    } finally {
      setPending(false);
    }
  };

  const handleResolveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolutionTargetId || resolutionNotes.trim().length < 5) {
      setError('Resolution notes must be at least 5 characters.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api.resolveComplaint(resolutionTargetId, {
        status: resolutionStatus,
        notes: resolutionNotes.trim(),
      });
      setResolutionTargetId(null);
      setResolutionNotes('');
      await loadPortals();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update complaint status.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <PublicPage title={t('complaintsTitle')} lead={t('complaintsLead')}>
      <div className="space-y-6">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          For urgent suspected fraud, misuse, or impersonation, use the dedicated{' '}
          <Link to="/report-fraud" className="underline font-semibold">
            fraud reporting page
          </Link>
          . Students appealing a vetting or aid decision can submit directly via{' '}
          <Link to="/student/appeals" className="underline font-semibold">
            student appeals
          </Link>
          .
        </p>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {submitted && (
          <div
            role="status"
            className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1 text-xs"
          >
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Complaint recorded — Reference {submitted.trackingRef}</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Your complaint ({submitted.category}) has been logged into the authorized governance review queue and anchored to the audit ledger.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="portal-card space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Submit a formal complaint</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="complaint-category" className="block text-xs font-semibold mb-1">
                Category
              </label>
              <select
                id="complaint-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="DONATION_ISSUE">Donation or receipt issue</option>
                <option value="VETTING_DECISION">Vetting or eligibility decision</option>
                <option value="DISBURSEMENT_DELAY">Disbursement delay or error</option>
                <option value="GOODS_HANDOVER">Physical goods handover</option>
                <option value="PRIVACY_CONCERN">Privacy or display name concern</option>
                <option value="OTHER">Other service complaint</option>
              </select>
            </div>

            <div>
              <label htmlFor="complaint-reference" className="block text-xs font-semibold mb-1">
                Safe Reference Code (Optional)
              </label>
              <input
                id="complaint-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Receipt, Case No., or CT206/204483/24"
                className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="complaint-subject" className="block text-xs font-semibold mb-1">
              Subject (minimum 5 characters)
            </label>
            <input
              id="complaint-subject"
              type="text"
              required
              minLength={5}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Concise summary of the issue"
              className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
            />
          </div>

          <div>
            <label htmlFor="complaint-description" className="block text-xs font-semibold mb-1">
              Detailed Description (minimum 15 characters)
            </label>
            <textarea
              id="complaint-description"
              rows={4}
              required
              minLength={15}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe relevant dates, steps taken, and desired resolution without passwords or private codes..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs"
            />
          </div>

          <div>
            <label htmlFor="complaint-contact" className="block text-xs font-semibold mb-1">
              Follow-up Contact Email or Phone (Optional)
            </label>
            <input
              id="complaint-contact"
              type="text"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              placeholder="Optional email or phone for response"
              className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Submitting…' : 'Submit complaint'}
          </button>
        </form>

        {canCreateAuth && myComplaints.length > 0 && (
          <section className="portal-card space-y-3">
            <h2 className="text-sm font-bold">My submitted complaints</h2>
            <ul className="space-y-2 text-xs">
              {myComplaints.map((item) => (
                <li
                  key={item.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold">
                      {item.trackingRef} — {item.subject || item.category}
                    </p>
                    <p className="text-zinc-500">{item.description}</p>
                  </div>
                  <span className="font-semibold uppercase text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canManage && queue.length > 0 && (
          <section className="portal-card space-y-3">
            <h2 className="text-sm font-bold">Authorized complaint &amp; fraud intake queue</h2>
            {resolutionTargetId && (
              <form onSubmit={handleResolveSubmit} className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 space-y-2">
                <p className="text-xs font-bold">Update complaint / report status</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={resolutionStatus}
                    onChange={(e) =>
                      setResolutionStatus(e.target.value as 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED')
                    }
                    className="h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                  >
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Resolution or triage notes (min 5 chars)"
                    className="flex-1 min-w-[200px] h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionTargetId(null)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <ul className="space-y-2 text-xs">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold">
                      {item.trackingRef} ({item.kind}) — {item.subject || item.category}
                    </p>
                    <p className="text-zinc-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionTargetId(item.id);
                        setResolutionNotes('');
                      }}
                      className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Update
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PublicPage>
  );
}
