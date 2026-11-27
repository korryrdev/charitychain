import { useState, type FormEvent } from 'react';
import { useTranslation } from '@/app/i18n/I18nContext';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/services/errorMapper';
import type { ComplaintRecord } from '@/types';
import { InformationGrid, PublicPage } from './PublicPage';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export function FraudReportPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('RECEIPT_ANOMALY');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<ComplaintRecord | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 15) {
      setError('Please describe the suspected anomaly in at least 15 characters.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await api.submitPublicFraudReport({
        category,
        description: description.trim(),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(reporterContact.trim() ? { reporterContact: reporterContact.trim() } : {}),
      });
      setSubmitted(res.report);
      setReference('');
      setDescription('');
      setReporterContact('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit confidential fraud report.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <PublicPage title={t('fraudTitle')} lead={t('fraudLead')}>
      <div className="space-y-6">
        <InformationGrid
          items={[
            {
              title: 'Preserve safe references',
              body: 'Record dates, provider references, receipt codes, and tracking IDs — never include your password, private verification secret, or OTP.',
            },
            {
              title: 'Do not confront anyone',
              body: 'Avoid escalating a suspected incident in person. Reports enter a protected forensic queue with access restricted to authorized auditors.',
            },
            {
              title: 'What happens next',
              body: 'Every submission creates a high-priority forensic alert and immutable audit event for independent investigation.',
            },
          ]}
        />

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {submitted ? (
          <section
            role="status"
            className="portal-card border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-center space-y-3"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-base font-bold">
              Report received — Tracking Reference {submitted.trackingRef}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
              Your incident report has been recorded in the forensic review queue and anchored to the audit ledger. Keep your tracking reference for future follow-up.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold"
            >
              Submit another report
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="portal-card space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Incident details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fraud-category" className="block text-xs font-semibold mb-1">
                  Anomaly Category
                </label>
                <select
                  id="fraud-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                >
                  <option value="RECEIPT_ANOMALY">Receipt code mismatch or duplicate</option>
                  <option value="UNAUTHORIZED_COLLECTION">Unauthorized relief item collection</option>
                  <option value="PAYOUT_DISCREPANCY">Disbursement / fee payment discrepancy</option>
                  <option value="IMPERSONATION">Suspected student, donor, or signatory impersonation</option>
                  <option value="OTHER">Other compliance anomaly</option>
                </select>
              </div>

              <div>
                <label htmlFor="fraud-reference" className="block text-xs font-semibold mb-1">
                  Safe Reference Code (Optional)
                </label>
                <input
                  id="fraud-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Receipt code, case number, or bank reference"
                  className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fraud-description" className="block text-xs font-semibold mb-1">
                Detailed Description (minimum 15 characters)
              </label>
              <textarea
                id="fraud-description"
                rows={4}
                required
                minLength={15}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe dates, sequence of events, and observable irregularities without including passwords or tracking secrets..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs"
              />
            </div>

            <div>
              <label htmlFor="fraud-contact" className="block text-xs font-semibold mb-1">
                Contact Email or Phone (Optional — leave blank to stay anonymous)
              </label>
              <input
                id="fraud-contact"
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="Leave blank to submit anonymously"
                className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {pending ? 'Submitting confidential report…' : 'Submit confidential report'}
            </button>
          </form>
        )}
      </div>
    </PublicPage>
  );
}
