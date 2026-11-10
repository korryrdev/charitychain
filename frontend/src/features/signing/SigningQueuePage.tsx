import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import {
  KeyRound,
  CheckCircle2,
  Wallet,
  Lock,
  FileCode,
  X,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import type { CaseRecord } from '@/types';

interface SignatoryAccount {
  name: string;
  address: string;
  title: string;
}

const SIGNATORIES: SignatoryAccount[] = [
  {
    name: 'Wanjiku Mwangi',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    title: 'Malkia Executive Chair (Signatory 1)',
  },
  {
    name: 'Kevin Otieno',
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    title: 'Malkia Executive Treasurer (Signatory 2)',
  },
  {
    name: 'Dr. Amina Hassan',
    address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    title: 'Staff Representative (Signatory 3)',
  },
];

export const SigningQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSignatory, setActiveSignatory] = useState<SignatoryAccount>(SIGNATORIES[0]);
  const [signingModalCase, setSigningModalCase] = useState<CaseRecord | null>(null);
  const [isSigningLive, setIsSigningLive] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  // Filter for cases that are awaiting signatures (APPROVED) or recently AUTHORIZED
  const signingCases = cases.filter((c) => c.state === 'APPROVED' || c.state === 'AUTHORIZED');

  const signMutation = useMutation({
    mutationFn: async ({ caseId, wallet }: { caseId: string; wallet: string }) => {
      setIsSigningLive(true);
      await new Promise((r) => setTimeout(r, 700));
      return api.signReleaseAuthorization(caseId, wallet);
    },
    onSuccess: () => {
      setIsSigningLive(false);
      setSigningModalCase(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setIsSigningLive(false);
      alert(err.message || 'Signature failed');
    },
  });

  const confirmSignature = () => {
    if (!signingModalCase) return;
    signMutation.mutate({
      caseId: signingModalCase.id,
      wallet: activeSignatory.address,
    });
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

      {/* Connected Signatory Persona & Switcher */}
      <Card className="border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Active Signing Wallet</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {activeSignatory.name}
              </span>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 block">
                {activeSignatory.address}
              </span>
            </div>
          </div>

          {/* Quick Signatory Switcher for Evaluation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Switch Signatory:</span>
            <div className="relative">
              <select
                value={activeSignatory.address}
                onChange={(e) => {
                  const found = SIGNATORIES.find((s) => s.address === e.target.value);
                  if (found) setActiveSignatory(found);
                }}
                className="text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 py-1.5 px-3 pr-8 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {SIGNATORIES.map((s) => (
                  <option key={s.address} value={s.address}>
                    {s.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
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
              (s) => s.signer.toLowerCase() === activeSignatory.address.toLowerCase()
            );
            const isAuthorized = c.state === 'AUTHORIZED';

            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80">
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
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-xl mt-2 italic">
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

                <div className="p-5 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Signatures status pill */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Signatures Collected: {c.signatorySignatures.length} of 2 required
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.signatorySignatures.map((sig, idx) => {
                        const isCurrentActive =
                          sig.signer.toLowerCase() === activeSignatory.address.toLowerCase();
                        return (
                          <span
                            key={sig.signer}
                            className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${
                              isCurrentActive
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            Signer #{idx + 1}: {sig.signer.slice(0, 6)}...{sig.signer.slice(-4)}
                          </span>
                        );
                      })}
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
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Release 2-of-3 Authorized for Payout
                      </span>
                    ) : hasSigned ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        ✓ {activeSignatory.name} has signed (switch signatory above to add 2nd signature)
                      </span>
                    ) : (
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={() => setSigningModalCase(c)}
                        className="gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        Sign EIP-712 Release
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* EIP-712 Typed Data Preview Modal */}
      {signingModalCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800 my-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  EIP-712 Typed Data Signature
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Confirm structured authorization for fund release on Polygon Amoy.
                </CardDescription>
              </div>
              <button
                onClick={() => setSigningModalCase(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 text-xs font-mono">
              {/* Domain & Message Breakdown */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  EIP-712 Domain Separator
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  name: "CharityChainCaseWorkflow"<br />
                  version: "1"<br />
                  chainId: 80002 (Polygon Amoy)<br />
                  verifyingContract: "0x789...CaseWorkflow"
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  Typed Message Parameters
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div>caseId: {signingModalCase.id}</div>
                  <div>caseRef: {signingModalCase.caseNumber}</div>
                  <div>
                    amountMinor:{' '}
                    {signingModalCase.approvedAmountMinor || signingModalCase.requestedAmountMinor} (KES)
                  </div>
                  <div>nonce: 1</div>
                  <div>deadline: Valid for 7 days</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 font-sans">
                Signing with: <strong className="font-mono">{activeSignatory.address}</strong> (
                {activeSignatory.name})
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSigningModalCase(null)}
              >
                Cancel
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={confirmSignature}
                isLoading={isSigningLive}
                className="gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                Confirm Signature in Wallet
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
