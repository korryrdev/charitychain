import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/app/auth/AuthContext';
import { KeyRound, ShieldAlert, CheckCircle2, UserCheck, Wallet, Lock } from 'lucide-react';
import type { CaseRecord } from '@/types';

export const SigningQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { signatoryWallet, role } = useAuth();
  const [signingCaseId, setSigningCaseId] = useState<string | null>(null);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  // Filter for cases that are awaiting signatures (APPROVED) or recently AUTHORIZED
  const signingCases = cases.filter((c) => c.state === 'APPROVED' || c.state === 'AUTHORIZED');

  const signMutation = useMutation({
    mutationFn: async ({ caseId, wallet }: { caseId: string; wallet: string }) => {
      setSigningCaseId(caseId);
      return api.signReleaseAuthorization(caseId, wallet);
    },
    onSuccess: () => {
      setSigningCaseId(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setSigningCaseId(null);
      alert(err.message || 'Signature failed');
    },
  });

  const handleSign = (caseItem: CaseRecord) => {
    signMutation.mutate({ caseId: caseItem.id, wallet: signatoryWallet });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-emerald-600" />
          2-of-3 Signatory Fund Release Queue
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          In accordance with Malkia Executive Committee governance, fund release requires at least two independent EIP-712 wallet signatures before money can be disbursed.
        </p>
      </div>

      {/* Connected Signatory Badge */}
      <Card className="border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-zinc-500 block">Connected Signatory Address</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{signatoryWallet}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-semibold">
              Authorized Signatory 1 of 3
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Releases Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-400">Loading release queue...</div>
      ) : signingCases.length === 0 ? (
        <Card className="p-12 text-center text-zinc-500">
          No cases currently awaiting signatory release authorizations.
        </Card>
      ) : (
        <div className="space-y-4">
          {signingCases.map((c) => {
            const hasSigned = c.signatorySignatures.some(
              (s) => s.signer.toLowerCase() === signatoryWallet.toLowerCase()
            );
            const isAuthorized = c.state === 'AUTHORIZED';

            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {c.caseNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {c.needCategory}
                      </span>
                      <StatusChip status={c.state} />
                    </div>
                    <p className="text-xs text-zinc-500">{c.subGroupName}</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-xl mt-2 italic">
                      "{c.justification}"
                    </p>
                  </div>

                  <div className="text-left md:text-right space-y-1 shrink-0">
                    <span className="text-xs text-zinc-500 block">Approved Release Amount</span>
                    <Money
                      amountMinor={c.approvedAmountMinor || c.requestedAmountMinor}
                      className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Signatures status pill */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Signatures Collected: {c.signatorySignatures.length} of 2 required
                    </div>
                    <div className="flex items-center gap-2">
                      {c.signatorySignatures.map((sig, idx) => (
                        <span
                          key={sig.signer}
                          className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        >
                          Signer #{idx + 1}: {sig.signer.slice(0, 6)}...{sig.signer.slice(-4)}
                        </span>
                      ))}
                      {c.signatorySignatures.length < 2 && (
                        <span className="text-[11px] text-zinc-400 italic">
                          Awaiting {2 - c.signatorySignatures.length} more signature
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div>
                    {isAuthorized ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Release Fully Authorized for Payout
                      </span>
                    ) : hasSigned ? (
                      <span className="text-xs font-medium text-zinc-500 italic">
                        You have signed. Awaiting second signatory.
                      </span>
                    ) : (
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={() => handleSign(c)}
                        isLoading={signingCaseId === c.id}
                        className="gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        Sign EIP-712 Typed Release
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

