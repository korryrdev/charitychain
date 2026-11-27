import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/services/errorMapper';
import type { MaskedDonorReferenceItem, RevealedDonorReferenceResult } from '@/types';
import { Eye, EyeOff, Search, ShieldCheck } from 'lucide-react';

export function DonorIdentityRevealPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [items, setItems] = useState<MaskedDonorReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<MaskedDonorReferenceItem | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<RevealedDonorReferenceResult | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listMaskedDonorReferences({ search: appliedSearch, pageSize: 50 })
      .then((res) => {
        if (!active) return;
        setItems(res.items ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Failed to load masked donor references.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAppliedSearch(search);
  };

  const handleRevealSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (reason.trim().length < 10) {
      setError('A justification reason of at least 10 characters is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.revealDonorReference(selected.donorRef, reason.trim());
      setRevealed(result);
      setReason('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to reveal donor identity.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="portal-page admin-page space-y-6">
      <header className="space-y-2">
        <p className="section-kicker">Donor identity governance (FR-DON-15)</p>
        <h1>Masked donor reference registry.</h1>
        <p className="portal-page__lead">
          Donor references remain masked by default across administration screens. Revealing an identity requires a documented reason (minimum 10 characters) and appends an immutable entry to the hash-chained audit ledger.
        </p>
      </header>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by donorRef hash or masked display…"
            aria-label="Filter donor references"
            className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 text-xs"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold"
        >
          Search
        </button>
      </form>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {revealed && (
        <section
          role="status"
          className="portal-card border-amber-400 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4" />
                Audited Donor Identity Disclosure
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                Reference <code className="font-mono">{revealed.donorRef}</code> resolved to{' '}
                <strong>{revealed.name}</strong> ({revealed.displayMode}).
              </p>
              {revealed.auditEventId && (
                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                  Logged immutable AuditEvent ID: {revealed.auditEventId}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setRevealed(null);
                setSelected(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Re-mask identity</span>
            </button>
          </div>
        </section>
      )}

      {selected && !revealed && (
        <section className="portal-card border-emerald-300 dark:border-emerald-800 space-y-3">
          <h2 className="text-sm font-bold">
            Reveal donor identity for <code className="font-mono">{selected.donorRef.slice(0, 18)}…</code>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Current masked value: <strong>{selected.maskedName}</strong>. State a lawful compliance or audit reason below (at least 10 characters). This action is permanently audit logged.
          </p>
          <form onSubmit={handleRevealSubmit} className="space-y-3">
            <div>
              <label htmlFor="reveal-reason" className="block text-xs font-semibold mb-1">
                Justification reason
              </label>
              <input
                id="reveal-reason"
                type="text"
                required
                minLength={10}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Investigating bank settlement discrepancy CASE-2026-004"
                className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{submitting ? 'Logging & revealing…' : 'Confirm audited reveal'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setReason('');
                }}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="portal-card">
        {loading ? (
          <p className="text-xs text-zinc-500">Loading masked donor references…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-zinc-500">No donor references recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-3">Masked Name</th>
                  <th className="py-2 pr-3">Donor Reference</th>
                  <th className="py-2 pr-3">Display Mode</th>
                  <th className="py-2 pr-3">Donations</th>
                  <th className="py-2">Audit Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.donorRef} className="border-b border-zinc-100 dark:border-zinc-800/70">
                    <td className="py-2.5 pr-3 font-semibold">{item.maskedName}</td>
                    <td className="py-2.5 pr-3 font-mono">{item.donorRef.slice(0, 20)}…</td>
                    <td className="py-2.5 pr-3">{item.displayMode}</td>
                    <td className="py-2.5 pr-3">{item.donationCount}</td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setRevealed(null);
                          setReason('');
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal with reason</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
