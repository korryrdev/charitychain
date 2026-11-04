import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckSquare, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { NeedCategory } from '@/types';

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [subGroup, setSubGroup] = useState('sub-eng');
  const [needCategory, setNeedCategory] = useState<NeedCategory>('FEES');
  const [amountMajor, setAmountMajor] = useState('3500'); // KES 3,500
  const [justification, setJustification] = useState('');
  const [hasConsent, setHasConsent] = useState(false);

  const subGroupNames: Record<string, string> = {
    'sub-eng': 'Engineering Students Sub-group',
    'sub-med': 'Health Sciences Sub-group',
    'sub-bus': 'Business Students Sub-group',
    'sub-sci': 'Applied Sciences Sub-group',
    'sub-art': 'Humanities & Social Sciences Sub-group',
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const amountMinor = Math.round(parseFloat(amountMajor || '0') * 100);
      return api.createCase({
        subGroupId: subGroup,
        subGroupName: subGroupNames[subGroup] || 'Campus Sub-group',
        needCategory,
        requestedAmountMinor: amountMinor,
        justification,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate('/app/cases');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) return;
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/app/cases')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cases Queue
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Submit Student Need Case
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Raise a case through your official campus sub-group. Beneficiary personal data remains encrypted off-chain.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-5">
            {/* Sub-group Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Sub-group Origin
              </label>
              <select
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
                className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 py-2.5 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {Object.entries(subGroupNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Need Category Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Need Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS'] as NeedCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNeedCategory(cat)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                      needCategory === cat
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-600 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Requested Amount in KES */}
            <div>
              <Input
                label="Requested Support Amount (KES)"
                type="number"
                min="100"
                step="50"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                placeholder="e.g. 3500"
                required
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Stored in database and contracts as integer minor units (e.g. KES {amountMajor || '0'} = {Math.round(parseFloat(amountMajor || '0') * 100)} minor units).
              </span>
            </div>

            {/* Justification Text */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Case Summary & Justification
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
                required
                placeholder="Describe the student need and urgency. Do not include raw national ID or phone numbers."
                className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              />
            </div>

            {/* Consent Box */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
              <input
                id="consent-check"
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                required
              />
              <label htmlFor="consent-check" className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 block mb-0.5">
                  Beneficiary Consent Captured (KDPA 2019 Compliance)
                </span>
                I confirm the beneficiary student has given informed consent to submit this case to Malkia Committee. Their direct identity is held off-chain and only salted hashes will be anchored.
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 p-6">
            <Button type="button" variant="outline" onClick={() => navigate('/app/cases')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emerald"
              disabled={!hasConsent || createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Submit Case to Committee
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

