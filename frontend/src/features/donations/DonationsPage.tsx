import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import { useAuth } from '@/app/auth/AuthContext';
import { api } from '@/lib/api';
import { Coins, Loader2 } from 'lucide-react';
import type { BankDeposit } from '@/types';

export const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bankRef, setBankRef] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [donorIdentity, setDonorIdentity] = useState('');

  const { data: deposits = [], isLoading } = useQuery<BankDeposit[]>({
    queryKey: ['bank-deposits'],
    queryFn: () => api.getBankDeposits(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { depositReference: string; donorIdentity: string; amount: number }) =>
      api.createBankDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
      setBankRef('');
      setAmountMajor('');
      setDonorIdentity('');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to record deposit');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.verifyBankDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Verification failed');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountMajor || !bankRef) return;
    createMutation.mutate({
      depositReference: bankRef.toUpperCase(),
      donorIdentity: donorIdentity.trim() || 'Anonymous Bank Donor',
      amount: parseFloat(amountMajor),
    });
  };

  const handleVerify = (id: string, enteredBy: string) => {
    if (enteredBy === user?.id || enteredBy === user?.email) {
      alert('You cannot verify a deposit you entered (Maker-Checker violation).');
      return;
    }
    verifyMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <Coins className="w-6 h-6 text-emerald-600" />
          Bank deposits
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">Log deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Bank Statement Wire Reference"
                placeholder="e.g. WIRE-892100"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                required
              />
              <Input
                label="Donor Identity / Email"
                placeholder="e.g. donor@example.com"
                value={donorIdentity}
                onChange={(e) => setDonorIdentity(e.target.value)}
              />
              <Input
                label="Amount (KES)"
                type="number"
                min="100"
                step="50"
                placeholder="e.g. 50000"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="emerald"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit for Second Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Pending verification</CardTitle>
            <CardDescription>
              Segregation of duties enforced: Maker cannot verify their own entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading deposits...</span>
              </div>
            ) : deposits.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No bank deposits recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {deposits.map((d) => {
                  const isMaker = d.enteredByUserId === user?.id || d.enteredByUserId === user?.email;
                  return (
                    <div
                      key={d.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {d.depositReference}
                          </span>
                          <StatusChip status={d.status === 'VERIFIED' ? 'POOLED' : 'UNDER_REVIEW'} />
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 space-x-2">
                          <span>
                            Entered by: <strong className="text-zinc-700 dark:text-zinc-300">{d.enteredByUserId}</strong>
                          </span>
                          {d.verifiedByUserId && (
                            <span>
                              • Verified by: <strong className="text-emerald-600">{d.verifiedByUserId}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Money amountMinor={d.amountMinor} className="text-lg font-bold" />
                        {d.status === 'PENDING_VERIFICATION' && (
                          <Button
                            size="sm"
                            variant={isMaker ? 'outline' : 'emerald'}
                            onClick={() => handleVerify(d.id, d.enteredByUserId)}
                            disabled={isMaker || verifyMutation.isPending}
                            className="text-xs shrink-0"
                          >
                            {isMaker ? 'Self-Verify Blocked' : 'Verify & Anchor Lot'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
