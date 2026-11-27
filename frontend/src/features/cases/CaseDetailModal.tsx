import React, { useState, useSyncExternalStore } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/app/auth/AuthContext';
import { authStore } from '../../store/auth.store';
import { hasPermission } from '../authorization/permissions';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react';
import type { CaseRecord, PortalSession, UploadedCaseEvidence } from '@/types';

interface CaseDetailModalProps {
  caseRecord: CaseRecord | null;
  onClose: () => void;
}

type DisbursementMethod = 'MPESA' | 'BANK' | 'CASH' | 'DIRECT_INSTITUTION' | 'ITEMS';

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ caseRecord, onClose }) => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const { session } = useSyncExternalStore(authStore.subscribe, authStore.get) as {
    session: PortalSession | null;
  };

  const [approveAmountMajor, setApproveAmountMajor] = useState<string>(
    caseRecord ? (caseRecord.requestedAmountMinor / 100).toString() : '0'
  );
  const [decisionNotes, setDecisionNotes] = useState('');
  const [disburseMethod, setDisburseMethod] = useState<DisbursementMethod>('MPESA');
  const [disburseMethodRef, setDisburseMethodRef] = useState('');
  const [disburseAmountMajor, setDisburseAmountMajor] = useState<string>(
    caseRecord
      ? ((caseRecord.approvedAmountMinor || caseRecord.requestedAmountMinor) / 100).toString()
      : '0'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<UploadedCaseEvidence | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const decisionMutation = useMutation({
    mutationFn: async (decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'UNDER_REVIEW') => {
      if (!caseRecord) throw new Error('Case record is missing');
      if ((decision === 'REJECTED' || decision === 'NEEDS_INFO') && decisionNotes.trim().length < 3) {
        throw new Error('Provide clear explanation notes (at least 3 characters).');
      }
      const amountMinor =
        decision === 'APPROVED' ? Math.round(parseFloat(approveAmountMajor || '0') * 100) : undefined;
      return api.decideCase(caseRecord.id, {
        decision,
        approvedAmountMinor: amountMinor,
        notes: decisionNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to record committee decision.');
    },
  });

  const uploadEvidenceMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!caseRecord) throw new Error('Case record is missing');
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const commaIndex = result.indexOf(',');
          resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
        };
        reader.onerror = () => reject(new Error('Failed to read selected evidence file.'));
        reader.readAsDataURL(file);
      });
      return api.uploadCaseEvidence(caseRecord.id, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Content,
        notes: `Disbursement evidence for ${caseRecord.caseNumber}`,
      });
    },
    onSuccess: (res) => {
      setActionError(null);
      setUploadedEvidence(res);
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : 'Failed to encrypt and pin evidence to IPFS.'
      );
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async () => {
      if (!caseRecord) throw new Error('Case record is missing');
      if (!disburseMethodRef.trim()) {
        throw new Error('Enter a payment or bank wire reference.');
      }
      if (!uploadedEvidence?.evidenceCid) {
        throw new Error('Upload and pin receipt evidence to IPFS before recording disbursement.');
      }
      const amountMinor = Math.round(parseFloat(disburseAmountMajor || '0') * 100);
      return api.recordDisbursement(caseRecord.id, {
        amountMinor,
        method: disburseMethod,
        methodReference: disburseMethodRef.trim(),
        evidenceCid: uploadedEvidence.evidenceCid,
        evidenceHash: uploadedEvidence.evidenceHash,
      });
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Disbursement recording failed.');
    },
  });

  if (!caseRecord) return null;

  const isSubmitter = Boolean(user?.id) && caseRecord.submitterId === user?.id;
  const inReviewableState = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'].includes(caseRecord.state);
  const canDecide =
    (session ? hasPermission(session, 'case:decide') : ['COMMITTEE', 'ADMIN'].includes(role)) &&
    inReviewableState;
  const canDisburse =
    (session
      ? hasPermission(session, 'disbursement:create')
      : ['TREASURER', 'ADMIN'].includes(role)) && caseRecord.state === 'AUTHORIZED';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800 my-8">
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
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {actionError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

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

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Sub-group Justification
            </h4>
            <div className="p-3.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
              &ldquo;{caseRecord.justification}&rdquo;
            </div>
          </div>

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

          {canDecide && (
            <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Committee Decision Action
              </h4>

              {isSubmitter ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>You submitted this case, so another committee member must review it.</span>
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

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Review / Decision Notes
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Committee rationale, requested clarification, or rejection reason..."
                      className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end pt-2">
                    {caseRecord.state !== 'UNDER_REVIEW' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decisionMutation.mutate('UNDER_REVIEW')}
                        isLoading={decisionMutation.isPending}
                      >
                        Mark Under Review
                      </Button>
                    )}
                    {caseRecord.state !== 'NEEDS_INFO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decisionMutation.mutate('NEEDS_INFO')}
                        isLoading={decisionMutation.isPending}
                      >
                        Request Info
                      </Button>
                    )}
                    {caseRecord.state !== 'NEEDS_INFO' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => decisionMutation.mutate('REJECTED')}
                        isLoading={decisionMutation.isPending}
                      >
                        Reject Case
                      </Button>
                    )}
                    {caseRecord.state !== 'NEEDS_INFO' && (
                      <Button
                        size="sm"
                        variant="emerald"
                        onClick={() => decisionMutation.mutate('APPROVED')}
                        isLoading={decisionMutation.isPending}
                      >
                        Approve &amp; Advance to Signatories
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {caseRecord.state === 'AUTHORIZED' && canDisburse && (
            <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                2-of-3 Release Authorized: Ready for Disbursement Payout
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Disbursement Method
                  </label>
                  <select
                    value={disburseMethod}
                    onChange={(e) => setDisburseMethod(e.target.value as DisbursementMethod)}
                    className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 text-xs font-medium"
                  >
                    <option value="MPESA">M-Pesa B2C / Paybill</option>
                    <option value="BANK">Bank Wire / EFT</option>
                    <option value="DIRECT_INSTITUTION">Direct Institution Fee Settlement</option>
                    <option value="CASH">Cash Voucher</option>
                    <option value="ITEMS">In-Kind Items Valuation</option>
                  </select>
                </div>

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

                <div className="p-3.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs space-y-2">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    Encrypted IPFS Receipt Evidence (AES-256-GCM)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,application/pdf,.txt,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        setUploadedEvidence(null);
                      }}
                      className="text-xs text-zinc-600 dark:text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!selectedFile || uploadEvidenceMutation.isPending}
                      isLoading={uploadEvidenceMutation.isPending}
                      onClick={() => selectedFile && uploadEvidenceMutation.mutate(selectedFile)}
                    >
                      Encrypt &amp; Pin to IPFS
                    </Button>
                  </div>

                  {uploadedEvidence && (
                    <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-900 dark:text-emerald-200 break-all space-y-0.5">
                      <div>IPFS CID: {uploadedEvidence.evidenceCid}</div>
                      <div>SHA-256 Digest: {uploadedEvidence.evidenceHash}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="emerald"
                    disabled={!uploadedEvidence?.evidenceCid || !disburseMethodRef.trim()}
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
              <p className="text-zinc-600 dark:text-zinc-400 break-all">
                Disbursed Amount:{' '}
                <Money
                  amountMinor={caseRecord.disbursedAmountMinor || caseRecord.requestedAmountMinor}
                  className="font-bold"
                />{' '}
                &bull; Evidence Encrypted on IPFS:{' '}
                <span className="font-mono">
                  {caseRecord.evidenceCid || 'No IPFS CID recorded'}
                </span>
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
