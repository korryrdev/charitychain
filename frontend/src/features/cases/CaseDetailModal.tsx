import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/app/auth/AuthContext';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import type { CaseRecord } from '@/types';

interface CaseDetailModalProps {
  caseRecord: CaseRecord | null;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ caseRecord, onClose }) => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  const [approveAmountMajor, setApproveAmountMajor] = useState<string>(
    caseRecord ? (caseRecord.requestedAmountMinor / 100).toString() : '0'
  );
  const [rejectReason, setRejectReason] = useState('');
  const [disburseMethodRef, setDisburseMethodRef] = useState('');
  const [disburseAmountMajor, setDisburseAmountMajor] = useState<string>(
    caseRecord
      ? ((caseRecord.approvedAmountMinor || caseRecord.requestedAmountMinor) / 100).toString()
      : '0'
  );
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'DECIDE' | 'DISBURSE'>('DETAILS');

  if (!caseRecord) return null;

  const isSubmitter = caseRecord.submitterId === (user?.id || 'current-user');
  const canDecide = ['COMMITTEE', 'ADMIN'].includes(role) && caseRecord.state === 'SUBMITTED';
  const canDisburse =
    ['COMMITTEE', 'TREASURER', 'ADMIN'].includes(role) && caseRecord.state === 'AUTHORIZED';

  const approveMutation = useMutation({
    mutationFn: async () => {
      const amountMinor = Math.round(parseFloat(approveAmountMajor) * 100);
      return api.approveCase(caseRecord.id, amountMinor, user?.id || 'current-user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: any) => {
      alert(err.message || 'Approval failed');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return api.rejectCase(caseRecord.id, rejectReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async () => {
      const amountMinor = Math.round(parseFloat(disburseAmountMajor) * 100);
      const fakeCid = `Qm${Math.random().toString(36).substring(2, 15)}...encrypted`;
      return api.recordDisbursement(
        caseRecord.id,
        amountMinor,
        disburseMethodRef.trim() || 'MPESA-B2C-AUTO',
        fakeCid
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: any) => {
      alert(err.message || 'Disbursement recording failed');
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {caseRecord.caseNumber}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {caseRecord.needCategory}
              </span>
              <StatusChip status={caseRecord.state} />
            </div>
            <p className="text-xs text-zinc-500 mt-1">{caseRecord.subGroupName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Key Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
            <div>
              <span className="text-zinc-500 block">Requested Amount</span>
              <Money
                amountMinor={caseRecord.requestedAmountMinor}
                className="text-base font-bold text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <span className="text-zinc-500 block">Approved Amount</span>
              <Money
                amountMinor={caseRecord.approvedAmountMinor || caseRecord.requestedAmountMinor}
                className="text-base font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <span className="text-zinc-500 block">Signatures</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {caseRecord.signatorySignatures.length} of 2 required
              </span>
            </div>
          </div>

          {/* Sub-group Case Justification */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Sub-group Justification
            </h4>
            <div className="p-3.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
              "{caseRecord.justification}"
            </div>
          </div>

          {/* Signatures List */}
          {caseRecord.signatorySignatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Signatory EIP-712 Authorizations
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-xs">
                {caseRecord.signatorySignatures.map((sig, idx) => (
                  <div key={sig.signer} className="p-3 flex items-center justify-between">
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                      Signer #{idx + 1}: {sig.signer}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(sig.signedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Tabs for Committee & Treasurers */}
          {caseRecord.state === 'SUBMITTED' && canDecide && (
            <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Committee Decision Action
              </h4>

              {isSubmitter ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Segregation of Duties (Rule R03): You submitted this case and cannot approve it. Another committee member must review.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Approved Amount in KES (Can be equal or less than requested)"
                    type="number"
                    value={approveAmountMajor}
                    onChange={(e) => setApproveAmountMajor(e.target.value)}
                    required
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate()}
                      isLoading={rejectMutation.isPending}
                    >
                      Reject Case
                    </Button>
                    <Button
                      size="sm"
                      variant="emerald"
                      onClick={() => approveMutation.mutate()}
                      isLoading={approveMutation.isPending}
                    >
                      Approve & Advance to Signatories
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Tabs for Disbursing AUTHORIZED Case */}
          {caseRecord.state === 'AUTHORIZED' && canDisburse && (
            <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                2-of-3 Release Authorized: Ready for Disbursement Payout
              </div>

              <div className="space-y-3">
                <Input
                  label="Disbursement Reference (M-Pesa B2C or Bank Wire Reference)"
                  placeholder="e.g. SGH98214K or WIRE-901"
                  value={disburseMethodRef}
                  onChange={(e) => setDisburseMethodRef(e.target.value)}
                  required
                />

                <Input
                  label="Disbursed Amount (KES)"
                  type="number"
                  value={disburseAmountMajor}
                  onChange={(e) => setDisburseAmountMajor(e.target.value)}
                  helperText="Disbursement cannot exceed authorized amount ceiling."
                  required
                />

                <div className="p-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Simulated Evidence Upload: Receipt photo will be AES-256 encrypted and pinned to IPFS</span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="emerald"
                    onClick={() => disburseMutation.mutate()}
                    isLoading={disburseMutation.isPending}
                  >
                    Confirm Disbursement Payout
                  </Button>
                </div>
              </div>
            </div>
          )}

          {caseRecord.state === 'DISBURSED' && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs space-y-1">
              <span className="font-bold text-green-900 dark:text-green-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> Case Payout Completed
              </span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Disbursed Amount: <Money amountMinor={caseRecord.disbursedAmountMinor || caseRecord.requestedAmountMinor} className="font-bold" /> • Evidence Encrypted on IPFS: <span className="font-mono">{caseRecord.evidenceCid || 'Qm7f8a9b...'}</span>
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 p-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

