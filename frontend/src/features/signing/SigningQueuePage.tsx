import React, { useMemo, useState } from 'react';
import Web3 from 'web3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchRegisteredSignatories } from '@/lib/web3Verify';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
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
  PlugZap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { CaseRecord } from '@/types';

const ZERO_CONTRACT_FALLBACK = '0x0000000000000000000000000000000000000001';

function buildEip712TypedData(
  c: CaseRecord,
  chainId: number,
  verifyingContract: string,
  nonce: number,
  deadline: number
) {
  const caseIdBytes32 = Web3.utils.keccak256(`malkia:v1:case:${c.id.toLowerCase()}`);
  const amountMinor = Number(c.approvedAmountMinor || c.requestedAmountMinor);

  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ReleaseAuthorization: [
        { name: 'caseId', type: 'bytes32' },
        { name: 'amountMinor', type: 'uint64' },
        { name: 'nonce', type: 'uint64' },
        { name: 'deadline', type: 'uint64' },
      ],
    },
    primaryType: 'ReleaseAuthorization',
    domain: {
      name: 'CharityChain CaseWorkflow',
      version: '1',
      chainId,
      verifyingContract,
    },
    message: {
      caseId: caseIdBytes32,
      amountMinor,
      nonce,
      deadline,
    },
  };
}

export const SigningQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [connectedChainId, setConnectedChainId] = useState<number>(
    Number(import.meta.env?.VITE_CHAIN_ID || 80002)
  );
  const [lastSignatureHex, setLastSignatureHex] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [signingModalCase, setSigningModalCase] = useState<CaseRecord | null>(null);
  const [modalDeadline, setModalDeadline] = useState<number>(0);
  const [isSigningLive, setIsSigningLive] = useState(false);

  const hasBrowserProvider =
    typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: any }).ethereum);

  const verifyingContract =
    (import.meta.env?.VITE_CASE_WORKFLOW_ADDRESS as string | undefined) || ZERO_CONTRACT_FALLBACK;

  const { data: registryInfo } = useQuery({
    queryKey: ['signatory-registry'],
    queryFn: () => fetchRegisteredSignatories(),
  });

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  const signingCases = cases.filter((c) => c.state === 'APPROVED' || c.state === 'AUTHORIZED');

  const isRegisteredOnChain = useMemo(() => {
    if (!connectedWallet || !registryInfo?.configured || !registryInfo.signatories.length) {
      return null;
    }
    return registryInfo.signatories.some(
      (addr) => addr.toLowerCase() === connectedWallet.toLowerCase()
    );
  }, [connectedWallet, registryInfo]);

  const connectMetaMask = async () => {
    setWalletError(null);
    const ethereum = (window as unknown as { ethereum?: any }).ethereum;
    if (!ethereum) {
      setWalletError(
        'No EIP-1193 browser wallet (MetaMask, Rabby, or hardware bridge) detected in this browser.'
      );
      return;
    }
    try {
      const web3 = new Web3(ethereum);
      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts?.length) {
        setWalletError('Wallet connection returned no accounts.');
        return;
      }
      const chainId = Number(await web3.eth.getChainId());
      setConnectedWallet(Web3.utils.toChecksumAddress(accounts[0]));
      setConnectedChainId(chainId);
    } catch (err: unknown) {
      setWalletError(err instanceof Error ? err.message : 'Could not connect browser wallet.');
    }
  };

  const modalTypedData = useMemo(() => {
    if (!signingModalCase) return null;
    return buildEip712TypedData(
      signingModalCase,
      connectedChainId,
      verifyingContract,
      0,
      modalDeadline
    );
  }, [signingModalCase, connectedChainId, verifyingContract, modalDeadline]);

  const signMutation = useMutation({
    mutationFn: async (targetCase: CaseRecord) => {
      if (!connectedWallet) {
        throw new Error('Connect a signatory wallet via MetaMask/EIP-1193 before signing.');
      }
      const ethereum = (window as unknown as { ethereum?: any }).ethereum;
      if (!ethereum) {
        throw new Error('Browser wallet is not connected.');
      }

      setIsSigningLive(true);
      setWalletError(null);

      const amountMinor = Number(targetCase.approvedAmountMinor || targetCase.requestedAmountMinor);
      const deadline = modalDeadline || Math.floor(Date.now() / 1000) + 7 * 86400;
      const typedData = buildEip712TypedData(
        targetCase,
        connectedChainId,
        verifyingContract,
        0,
        deadline
      );

      const signatureHex = (await ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [connectedWallet, JSON.stringify(typedData)],
      })) as string;

      setLastSignatureHex(signatureHex);
      return api.signReleaseAuthorization(targetCase.id, {
        signer: connectedWallet,
        signature: signatureHex,
        amountMinor,
        nonce: 0,
        deadline,
        chainId: connectedChainId,
        verifyingContract,
        signMethod: 'METAMASK_EIP712',
      });
    },
    onSuccess: () => {
      setIsSigningLive(false);
      setSigningModalCase(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: unknown) => {
      setIsSigningLive(false);
      setWalletError(err instanceof Error ? err.message : 'EIP-712 signature failed.');
    },
  });

  const confirmSignature = () => {
    if (!signingModalCase) return;
    signMutation.mutate(signingModalCase);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-emerald-600" />
            Signing queue (Web3.js EIP-712 2-of-3)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Matches <span className="font-mono">CaseWorkflow.sol</span> domain{' '}
            <span className="font-mono">&ldquo;CharityChain CaseWorkflow&rdquo;</span> (v1)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={connectedWallet ? 'emerald' : 'outline'}
            size="sm"
            onClick={connectMetaMask}
            className="gap-1.5 text-xs"
          >
            <PlugZap className="w-3.5 h-3.5" />
            {connectedWallet
              ? `MetaMask: ${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
              : 'Connect MetaMask (Web3.js)'}
          </Button>
        </div>
      </div>

      {walletError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300"
        >
          {walletError}
        </div>
      )}

      {lastSignatureHex && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate font-mono">
            Last EIP-712 signature recorded: {lastSignatureHex}
          </span>
        </div>
      )}

      <Card className="border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">
                {connectedWallet
                  ? `Connected EIP-1193 Signatory Wallet (Chain ID ${connectedChainId})`
                  : hasBrowserProvider
                    ? 'Wallet Detected — Connect MetaMask to Authorize Releases'
                    : 'No Browser Wallet Extension Detected'}
              </span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {connectedWallet ? 'Hardware / Extension Signer Ready' : 'Wallet Connection Required'}
              </span>
              {connectedWallet && (
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 block">
                  {connectedWallet}
                </span>
              )}
            </div>
          </div>

          {isRegisteredOnChain === false && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4" />
              Wallet not in on-chain SignatoryRegistry
            </span>
          )}
          {isRegisteredOnChain === true && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              Verified on SignatoryRegistry
            </span>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="p-12 text-center text-zinc-400">Loading release queue...</div>
      ) : signingCases.length === 0 ? (
        <Card className="p-12 text-center text-zinc-500">
          No cases currently awaiting signatory release authorizations.
        </Card>
      ) : (
        <div className="space-y-4">
          {signingCases.map((c) => {
            const hasSigned = Boolean(
              connectedWallet &&
                c.signatorySignatures.some(
                  (s) => s.signer.toLowerCase() === connectedWallet.toLowerCase()
                )
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
                      &ldquo;{c.justification}&rdquo;
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
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Signatures Collected: {c.signatorySignatures.length} of 2 required
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.signatorySignatures.map((sig, idx) => {
                        const isCurrentActive = Boolean(
                          connectedWallet &&
                            sig.signer.toLowerCase() === connectedWallet.toLowerCase()
                        );
                        return (
                          <span
                            key={`${sig.signer}-${idx}`}
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

                  <div>
                    {isAuthorized ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Release 2-of-3 Authorized for Payout
                      </span>
                    ) : hasSigned ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        Signed by connected wallet (switch wallet for 2nd signature)
                      </span>
                    ) : (
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={() => {
                          setModalDeadline(Math.floor(Date.now() / 1000) + 7 * 86400);
                          setSigningModalCase(c);
                        }}
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

      {signingModalCase && modalTypedData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800 my-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  Sign EIP-712 Release Authorization
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setSigningModalCase(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  EIP-712 Domain Separator
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  name: &quot;{modalTypedData.domain.name}&quot;
                  <br />
                  version: &quot;{modalTypedData.domain.version}&quot;
                  <br />
                  chainId: {modalTypedData.domain.chainId}
                  <br />
                  verifyingContract: {modalTypedData.domain.verifyingContract}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  ReleaseAuthorization Typed Message
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div>caseRef: {signingModalCase.caseNumber}</div>
                  <div className="truncate">caseId (bytes32): {modalTypedData.message.caseId}</div>
                  <div>amountMinor: {modalTypedData.message.amountMinor} (KES)</div>
                  <div>nonce: {modalTypedData.message.nonce}</div>
                  <div>deadline: {new Date(modalTypedData.message.deadline * 1000).toISOString()}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 font-sans">
                {connectedWallet ? (
                  <span>
                    Will invoke <code className="font-mono">eth_signTypedData_v4</code> via{' '}
                    <strong>Web3.js</strong> using connected wallet{' '}
                    <strong className="font-mono">{connectedWallet}</strong>.
                  </span>
                ) : (
                  <span>
                    Connect your MetaMask/EIP-1193 wallet first to sign this typed payload.
                  </span>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-4">
              <Button variant="outline" size="sm" onClick={() => setSigningModalCase(null)}>
                Cancel
              </Button>
              <Button
                variant="emerald"
                size="sm"
                disabled={!connectedWallet}
                onClick={confirmSignature}
                isLoading={isSigningLive}
                className="gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                Sign with MetaMask
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
